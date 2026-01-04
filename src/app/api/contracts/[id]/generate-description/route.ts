import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Contract from '@/models/Contract';
import { generateContractDescription, extractTextFromPDF } from '@/lib/ai-service';
import connectDB from '@/lib/mongodb';
import path from 'path';
import fs from 'fs/promises';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const contract = await Contract.findById(params.id);

        if (!contract) {
            return NextResponse.json(
                { error: 'Umowa nie została znaleziona' },
                { status: 404 }
            );
        }

        let contractText = '';

        // Jeśli mamy OCR text, użyjmy go
        if (contract.ocrText) {
            contractText = contract.ocrText;
        } else {
            // W przeciwnym razie spróbujmy wyodrębnić tekst z PDF
            try {
                const pdfPath = path.join(process.cwd(), contract.pdfPath);
                const pdfBuffer = await fs.readFile(pdfPath);
                contractText = await extractTextFromPDF(pdfBuffer);
            } catch (error) {
                console.error('Error reading PDF:', error);
                throw new Error('Nie można odczytać pliku PDF');
            }
        }

        if (!contractText.trim()) {
            return NextResponse.json(
                { error: 'Nie można wyodrębnić tekstu z umowy' },
                { status: 400 }
            );
        }

        // Generuj opis przez AI
        const aiDescription = await generateContractDescription(
            contractText,
            contract.originalFileName
        );

        // Aktualizuj umowę w bazie danych
        const updatedContract = await Contract.findByIdAndUpdate(
            params.id,
            {
                description: aiDescription.description,
                metadata: {
                    ...contract.metadata,
                    contractType: aiDescription.contractType || contract.metadata.contractType,
                    client: aiDescription.client || contract.metadata.client,
                    value: aiDescription.value || contract.metadata.value,
                    contractDate: aiDescription.dates?.contractDate || contract.metadata.contractDate,
                    startDate: aiDescription.dates?.startDate || contract.metadata.startDate,
                    endDate: aiDescription.dates?.endDate || contract.metadata.endDate,
                }
            },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            description: aiDescription.description,
            keyPoints: aiDescription.keyPoints,
            metadata: aiDescription,
            contract: updatedContract
        });

    } catch (error) {
        console.error('Error generating contract description:', error);
        return NextResponse.json(
            { error: 'Wystąpił błąd podczas generowania opisu' },
            { status: 500 }
        );
    }
}
