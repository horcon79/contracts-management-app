import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import { OCRService } from '@/lib/ocr-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role === 'read') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        const { id } = await params;
        const body = await request.json();
        const { apiKey, model, action } = body;

        if (!apiKey) {
            return NextResponse.json({ error: 'Klucz API jest wymagany' }, { status: 400 });
        }

        // Sprawdź czy kontrakt istnieje
        const contract = await Contract.findById(id);
        if (!contract) {
            return NextResponse.json({ error: 'Kontrakt nie został znaleziony' }, { status: 404 });
        }

        const ocrService = new OCRService(apiKey);

        // Sprawdź dostępność modelu
        const modelAvailable = await ocrService.checkModelAvailability(model, apiKey);
        if (!modelAvailable) {
            return NextResponse.json({
                error: `Model ${model} nie jest dostępny dla tego klucza API`
            }, { status: 400 });
        }

        let result;

        if (action === 'ocr') {
            // Ekstraktuj tekst z PDF
            result = await ocrService.extractTextFromPDF(contract.pdfPath, {
                apiKey,
                model,
                maxTokens: 4000,
                temperature: 0.1
            });

            if (result.success && result.extractedText) {
                // Zaktualizuj kontrakt o wyodrębniony tekst
                contract.ocrText = result.extractedText;
                await contract.save();
            }

        } else if (action === 'summary') {
            // Generuj podsumowanie (wymaga istniejącego tekstu OCR)
            const textToSummarize = contract.ocrText || contract.metadata?.contractType;
            if (!textToSummarize) {
                return NextResponse.json({
                    error: 'Nie można wygenerować podsumowania. Najpierw wykonaj OCR lub podaj tekst do podsumowania.'
                }, { status: 400 });
            }

            result = await ocrService.generateContractSummary(textToSummarize, {
                apiKey,
                model,
                maxTokens: 1000,
                temperature: 0.3
            });

            if (result.success && result.extractedText) {
                // Zaktualizuj kontrakt o podsumowanie
                contract.aiSummary = result.extractedText;
                await contract.save();
            }
        } else {
            return NextResponse.json({
                error: 'Nieprawidłowa akcja. Dostępne: ocr, summary'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: result.success,
            data: result,
            maskedApiKey: OCRService.maskApiKey(apiKey)
        });

    } catch (error) {
        console.error('Błąd OCR API:', error);

        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { id } = await params;

        // Sprawdź czy kontrakt istnieje
        const contract = await Contract.findById(id);
        if (!contract) {
            return NextResponse.json({ error: 'Kontrakt nie został znaleziony' }, { status: 404 });
        }

        // Sprawdź uprawnienia użytkownika
        if (session.user.role === 'read') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Zwróć informacje o statusie OCR
        const ocrStatus = {
            hasOcrText: !!contract.ocrText,
            hasAiSummary: !!contract.aiSummary,
            ocrTextLength: contract.ocrText?.length || 0,
            summaryLength: contract.aiSummary?.length || 0,
            lastUpdated: contract.updatedAt
        };

        return NextResponse.json({
            success: true,
            data: ocrStatus
        });

    } catch (error) {
        console.error('Błąd pobierania statusu OCR:', error);

        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd'
        }, { status: 500 });
    }
}
