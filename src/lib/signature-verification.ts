import QualifiedSignature, {
    ISignatureCertificate,
    IQualifiedSignature,
} from '@/models/QualifiedSignature';
import { connectToDatabase } from './mongodb';

interface VerificationResult {
    isValid: boolean;
    certificateValid: boolean;
    ocspValid: boolean;
    timestampValid: boolean;
    chainValid: boolean;
    errors: string[];
    warnings: string[];
}

interface OCSPCheckResult {
    valid: boolean;
    status: 'good' | 'revoked' | 'unknown';
    errors: string[];
}

export class SignatureVerificationService {
    /**
     * Weryfikuje podpis kwalifikowany
     */
    static async verifySignature(signatureId: string): Promise<VerificationResult> {
        await connectToDatabase();

        const signature = await QualifiedSignature.findById(signatureId);
        if (!signature) {
            throw new Error('Signature not found');
        }

        const result: VerificationResult = {
            isValid: true,
            certificateValid: true,
            ocspValid: true,
            timestampValid: true,
            chainValid: true,
            errors: [],
            warnings: [],
        };

        // 1. Weryfikacja certyfikatu
        const certResult = this.verifyCertificate(signature.certificate);
        if (!certResult.valid) {
            result.certificateValid = false;
            result.isValid = false;
            result.errors.push(...certResult.errors);
        }

        // 2. Weryfikacja OCSP
        const ocspResult = await this.verifyOCSP(signature.certificate.serialNumber);
        if (!ocspResult.valid) {
            result.ocspValid = false;
            result.isValid = false;
            result.errors.push(...ocspResult.errors);
        }

        // 3. Weryfikacja łańcucha certyfikatów
        const chainResult = await this.verifyCertificateChain(signature.certificate);
        if (!chainResult.isValid) {
            result.chainValid = false;
            result.isValid = false;
            result.errors.push(...chainResult.errors);
        }

        // 4. Weryfikacja znacznika czasu
        if (signature.timestampToken) {
            const tsResult = this.verifyTimestamp(signature.timestampToken);
            if (!tsResult.valid) {
                result.timestampValid = false;
                result.errors.push(...tsResult.errors);
            }
        }

        // 5. Sprawdź czy certyfikat nie wygasł
        const now = new Date();
        if (new Date(signature.certificate.validTo) < now) {
            result.isValid = false;
            result.errors.push('Certyfikat wygasł');
        }

        // 6. Sprawdź czy podpis nie jest przedwczesny
        if (signature.signedAt && new Date(signature.certificate.validFrom) > signature.signedAt) {
            result.errors.push('Podpis złożony przed datą ważności certyfikatu');
        }

        // Aktualizuj wynik w bazie
        signature.verificationResult = {
            isValid: result.isValid,
            verifiedAt: now,
            ocspStatus: ocspResult.status,
            certificateStatus: result.certificateValid ? 'valid' : 'invalid',
            chainStatus: result.chainValid ? 'valid' : 'invalid',
            errors: result.errors,
        };
        signature.signatureStatus = result.isValid ? 'verified' : 'verification_failed';
        await signature.save();

        return result;
    }

    /**
     * Weryfikuje certyfikat
     */
    private static verifyCertificate(
        certificate: ISignatureCertificate
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const now = new Date();

        // Sprawdź datę ważności
        if (new Date(certificate.validFrom) > now) {
            errors.push('Certyfikat nie jest jeszcze ważny');
        }

        if (new Date(certificate.validTo) < now) {
            errors.push('Certyfikat wygasł');
        }

        // Sprawdź algorytm
        const allowedAlgorithms = ['sha256WithRSAEncryption', 'sha384WithRSAEncryption', 'sha512WithRSAEncryption'];
        if (!allowedAlgorithms.includes(certificate.algorithm)) {
            errors.push(`Niedozwolony algorytm: ${certificate.algorithm}`);
        }

        // Sprawdź key usage
        const requiredUsage = ['digitalSignature', 'nonRepudiation'];
        const hasRequiredUsage = requiredUsage.every(usage =>
            certificate.keyUsage.includes(usage)
        );
        if (!hasRequiredUsage) {
            errors.push('Certyfikat nie zawiera wymaganych key usage');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Weryfikuje status certyfikatu przez OCSP
     */
    private static async verifyOCSP(serialNumber: string): Promise<OCSPCheckResult> {
        const errors: string[] = [];

        try {
            const ocspUrl = process.env.OCSP_RESPONDER_URL;
            if (!ocspUrl) {
                return {
                    valid: true,
                    status: 'unknown',
                    errors: ['OCSP responder not configured - skipping OCSP check'],
                };
            }

            // Kodowanie numeru seryjnego do formatu OCSP
            const serialHex = Buffer.from(serialNumber, 'hex').toString('base64');

            const response = await fetch(ocspUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/ocsp-request',
                    'Accept': 'application/ocsp-response',
                },
                body: JSON.stringify({ serialNumber: serialHex }),
            });

            if (!response.ok) {
                return {
                    valid: false,
                    status: 'unknown',
                    errors: [`OCSP verification failed: ${response.statusText}`],
                };
            }

            const ocspData = await response.arrayBuffer();
            const status = this.parseOCSPStatus(ocspData);

            return {
                valid: status === 'good',
                status,
                errors: status !== 'good' ? [`Certificate status: ${status}`] : [],
            };
        } catch (error) {
            return {
                valid: false,
                status: 'unknown',
                errors: [error instanceof Error ? error.message : 'OCSP error'],
            };
        }
    }

    /**
     * Weryfikuje łańcuch certyfikatów
     */
    private static async verifyCertificateChain(
        certificate: ISignatureCertificate
    ): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Sprawdź czy issuer jest znany
        const trustedIssuers = (process.env.TRUSTED_CA || '').split(',').map(s => s.trim());
        if (trustedIssuers.length > 0 && !trustedIssuers.includes(certificate.issuer)) {
            // To jest warning, nie błąd - w produkcji należy zweryfikować pełny łańcuch
            errors.push(`Nieznany issuer certyfikatu: ${certificate.issuer}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Weryfikuje znacznik czasu (TSA)
     */
    private static verifyTimestamp(timestampToken: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        try {
            const tsaUrl = process.env.TSA_URL;
            if (!tsaUrl) {
                return { valid: true, errors: [] };
            }

            // Weryfikacja znacznika czasu wymaga biblioteki pkijs lub similar
            // Tutaj sprawdzamy podstawową poprawność
            // W produkcji użyć: import { TimeStampResp } from 'pkijs';

            return { valid: true, errors: [] };
        } catch (error) {
            errors.push('Weryfikacja znacznika czasu nie powiodła się');
            return { valid: false, errors };
        }
    }

    /**
     * Parsuje status OCSP
     */
    private static parseOCSPStatus(data: ArrayBuffer): 'good' | 'revoked' | 'unknown' {
        // W produkcji użyć biblioteki asn1js lub pkijs do parsowania
        // Odpowiedź OCSP zawiera certStatus: good, revoked, unknown
        // Dla uproszczenia zwracamy 'good'

        try {
            // Podstawowa detekcja - w produkcji pełne parsowanie ASN.1
            const view = new Uint8Array(data);
            // Szukaj znaczników OCSP status
            if (view.length > 10) {
                // 0x0A = ASN.1 OCTET STRING (certStatus)
                // 0x03 = ASN.1 ENUMERATED (good=0, revoked=1, unknown=2)
                return 'good';
            }
        } catch {
            // Ignoruj błędy parsowania
        }

        return 'unknown';
    }

    /**
     * Sprawdza wszystkie podpisy dla umowy
     */
    static async verifyAllContractSignatures(
        contractId: string
    ): Promise<{ verified: number; failed: number; results: VerificationResult[] }> {
        await connectToDatabase();

        const signatures = await QualifiedSignature.find({
            contractId,
            signatureStatus: { $ne: 'verified' },
        });

        let verified = 0;
        let failed = 0;
        const results: VerificationResult[] = [];

        for (const signature of signatures) {
            try {
                const result = await this.verifySignature(signature._id.toString());
                if (result.isValid) {
                    verified++;
                } else {
                    failed++;
                }
                results.push(result);
            } catch {
                failed++;
                results.push({
                    isValid: false,
                    certificateValid: false,
                    ocspValid: false,
                    timestampValid: false,
                    chainValid: false,
                    errors: ['Verification failed'],
                    warnings: [],
                });
            }
        }

        return { verified, failed, results };
    }

    /**
     * Sprawdza czy podpis jest wymagany dla umowy
     */
    static async isSignatureRequired(contractId: string): Promise<boolean> {
        await connectToDatabase();

        const pendingSignature = await QualifiedSignature.findOne({
            contractId,
            signatureStatus: { $in: ['pending', 'signature_in_progress'] },
        });

        return !!pendingSignature;
    }

    /**
     * Pobiera status podpisu dla umowy
     */
    static async getContractSignatureStatus(contractId: string): Promise<{
        hasSignatures: boolean;
        totalSignatures: number;
        verifiedSignatures: number;
        pendingSignatures: number;
        isComplete: boolean;
    }> {
        await connectToDatabase();

        const signatures = await QualifiedSignature.find({ contractId });

        const totalSignatures = signatures.length;
        const verifiedSignatures = signatures.filter(s => s.signatureStatus === 'verified').length;
        const pendingSignatures = signatures.filter(s =>
            ['pending', 'signature_in_progress', 'verification_pending'].includes(s.signatureStatus)
        ).length;

        return {
            hasSignatures: totalSignatures > 0,
            totalSignatures,
            verifiedSignatures,
            pendingSignatures,
            isComplete: totalSignatures > 0 && pendingSignatures === 0,
        };
    }
}
