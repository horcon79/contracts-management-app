import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Contract from '@/models/Contract';
import { generateContractDescription } from '@/lib/ai-service';
import { connectToDatabase } from '@/lib/mongodb';
import { OCRService } from '@/lib/ocr-service';
import path from 'path';
import fs from 'fs/promises';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectToDatabase();

        // Fetch settings
        const settingsObj = await OCRService.getSettings();
        const apiKey = settingsObj.openai_api_key;
        const model = settingsObj.default_model || 'gpt-4o-mini';

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Klucz API OpenAI nie jest skonfigurowany w ustawieniach systemu.' },
                { status: 400 }
            );
        }

        const contract = await Contract.findById(id);

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
                const ocrService = new OCRService(apiKey);
                const result = await ocrService.extractTextFromPDF(contract.pdfPath, {
                    apiKey,
                    model
                });

                if (result.success && result.extractedText) {
                    contractText = result.extractedText;
                    // Zapisujemy wyodrębniony tekst
                    contract.ocrText = contractText;
                    await contract.save();
                } else {
                    throw new Error(result.error || 'Nie można wyodrębnić tekstu z PDF');
                }
            } catch (error) {
                console.error('Error reading PDF:', error);
                return NextResponse.json(
                    { error: error instanceof Error ? error.message : 'Nie można odczytać pliku PDF' },
                    { status: 500 }
                );
            }
        }

        if (!contractText || !contractText.trim()) {
            return NextResponse.json(
                { error: 'Dokument jest pusty lub nie udało się wyodrębnić tekstu' },
                { status: 400 }
            );
        }

        // Generuj opis przez AI
        const aiDescription = await generateContractDescription(
            contractText,
            contract.originalFileName,
            { apiKey, model }
        );

        // Aktualizuj umowę w bazie danych
        const updatedContract = await Contract.findByIdAndUpdate(
            id,
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
