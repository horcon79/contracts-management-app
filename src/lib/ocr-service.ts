import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import Settings from '@/models/Settings';
import { connectToDatabase } from '@/lib/mongodb';
import pdfParse from 'pdf-parse';

export interface OCRResult {
    success: boolean;
    extractedText?: string;
    error?: string;
    modelUsed?: string;
}

export interface OCROptions {
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
}

export class OCRService {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({
            apiKey: apiKey,
        });
    }

    /**
     * Pobiera ustawienia systemowe z bazy danych
     */
    static async getSettings() {
        await connectToDatabase();
        const settingsList = await Settings.find({});
        return settingsList.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    /**
     * Ekstraktuje tekst z pliku PDF
     * Najpierw próbuje pdf-parse (szybkie, tekstowe), jeśli puste - Vision (wolne, ocr)
     */
    async extractTextFromPDF(filePath: string, options: OCROptions): Promise<OCRResult> {
        try {
            // Sprawdź czy plik istnieje i zbuduj poprawną ścieżkę
            let absolutePath = filePath;

            // Pobierz katalog uploadów z env lub domyślny
            const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

            // Logika mapowania ścieżek
            if (filePath.startsWith('/api/contracts/view/')) {
                // Wyodrębnij nazwę pliku z URL API
                const fileName = filePath.replace('/api/contracts/view/', '');
                absolutePath = path.join(uploadDir, fileName);
            } else if (filePath.startsWith('/uploads/')) {
                // Obsługa starszych ścieżek
                absolutePath = path.join(uploadDir, filePath.replace('/uploads/', ''));
            } else if (!path.isAbsolute(filePath)) {
                // Jeśli relatywna, weź basename (bezpiecznik)
                absolutePath = path.join(uploadDir, path.basename(filePath));
            } else if (filePath.startsWith('/app/uploads/') === false && filePath.includes('uploads')) {
                // Jeśli absolutna ale poza kontenerem (np. lokalna ścieżka z dev), weź basename
                absolutePath = path.join(uploadDir, path.basename(filePath));
            } else if (!fs.existsSync(absolutePath)) {
                // Ostateczny bezpiecznik: jeśli po prostu nie istnieje pod podaną ścieżką, spróbuj basename w uploadDir
                const fallbackPath = path.join(uploadDir, path.basename(filePath));
                if (fs.existsSync(fallbackPath)) {
                    absolutePath = fallbackPath;
                }
            }

            console.log(`[OCRService] Resolving path input: "${filePath}" -> Result: "${absolutePath}"`);

            if (!fs.existsSync(absolutePath)) {
                return {
                    success: false,
                    error: `Plik nie został znaleziony: ${absolutePath} (oryginalna ścieżka: ${filePath})`
                };
            }

            const fileBuffer = fs.readFileSync(absolutePath);

            // Próba 1: pdf-parse
            try {
                const data = await pdfParse(fileBuffer);
                if (data.text && data.text.trim().length > 100) {
                    return {
                        success: true,
                        extractedText: data.text,
                        modelUsed: 'pdf-parse'
                    };
                }
            } catch (e) {
                console.warn('pdf-parse failed, falling back to Vision:', e);
            }

            // Próba 2: Vision API (tylko dla obrazów/skanów)
            // Uwaga: OpenAI Vision nie obsługuje PDF bezpośrednio, trzeba by go zamienić na obrazy.
            // Tymczasem ograniczymy się do błędu jeśli pdf-parse zawiedzie a to nie obraz.
            const ext = path.extname(absolutePath).toLowerCase();
            if (ext !== '.pdf') {
                const base64Content = fileBuffer.toString('base64');
                const mimeType = this.getMimeType(absolutePath);

                const response = await this.openai.chat.completions.create({
                    model: options.model,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Proszę wyodrębnić cały tekst z tego obrazu. Zachowaj strukturę. Zwróć tylko tekst.'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Content}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: options.maxTokens || 4000,
                    temperature: options.temperature || 0.1
                });

                return {
                    success: true,
                    extractedText: response.choices[0]?.message?.content || '',
                    modelUsed: options.model
                };
            }

            return {
                success: false,
                error: 'Plik PDF wygląda na skan lub obraz. Obecny system obsługuje tylko PDF z warstwą tekstową. Spróbuj skonwertować plik na format tekstowy (OCR) przed przesłaniem.'
            };
        } catch (error) {
            console.error('Błąd OCR:', error);

            if (error instanceof Error) {
                if (error.message.includes('401') || error.message.includes('Invalid API key')) {
                    return {
                        success: false,
                        error: 'Nieprawidłowy klucz API OpenAI'
                    };
                }
                if (error.message.includes('429')) {
                    return {
                        success: false,
                        error: 'Przekroczono limit API OpenAI. Spróbuj ponownie później.'
                    };
                }
                if (error.message.includes('413')) {
                    return {
                        success: false,
                        error: 'Plik jest za duży. Maksymalny rozmiar to 20MB.'
                    };
                }
            }

            return {
                success: false,
                error: `Błąd podczas przetwarzania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
            };
        }
    }

    /**
     * Generuje podsumowanie umowy używając OpenAI
     */
    async generateContractSummary(text: string, options: OCROptions): Promise<OCRResult> {
        try {
            const response = await this.openai.chat.completions.create({
                model: options.model,
                messages: [
                    {
                        role: 'system',
                        content: 'Jesteś specjalistą od spraw kancelaryjnych w firmie, podsumuj ten dokument w kilku zdaniach, jeżeli to umowa to w podsumowaniu zaznacz: Kogo z kim łączy, czego dotyczy, od kiedy obowiązuje, do kiedy obowiązuje, czy przewiduje płatności miesięczne, jaki ma termin wypowiedzenia, jeżeli są w niej określone adresy email lub osoby kontaktowe, lub dane kontaktowe niech te dane będą w twoim podsumowaniu.'
                    },
                    {
                        role: 'user',
                        content: `Proszę stwórz szczegółowe podsumowanie tej umowy:\n\n${text}`
                    }
                ],
                max_tokens: options.maxTokens || 1000,
                temperature: options.temperature || 0.3
            });

            const summary = response.choices[0]?.message?.content;

            if (!summary) {
                return {
                    success: false,
                    error: 'Nie udało się wygenerować podsumowania'
                };
            }

            return {
                success: true,
                extractedText: summary,
                modelUsed: options.model
            };

        } catch (error) {
            console.error('Błąd generowania podsumowania:', error);

            if (error instanceof Error) {
                if (error.message.includes('401') || error.message.includes('Invalid API key')) {
                    return {
                        success: false,
                        error: 'Nieprawidłowy klucz API OpenAI'
                    };
                }
            }

            return {
                success: false,
                error: `Błąd podczas generowania podsumowania: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
            };
        }
    }

    /**
     * Sprawdza dostępność modelu OpenAI
     */
    async checkModelAvailability(model: string, apiKey: string): Promise<boolean> {
        try {
            const tempClient = new OpenAI({ apiKey });
            const response = await tempClient.models.list();
            const availableModels = response.data.map(model => model.id);
            return availableModels.includes(model);
        } catch (error) {
            console.error('Błąd sprawdzania modelu:', error);
            return false;
        }
    }

    /**
     * Zwraca listę dostępnych modeli OpenAI
     */
    getAvailableModels(): Array<{ id: string; name: string; description: string }> {
        return [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: 'Najnowszy model multimodalny, najlepszy dla OCR i analizy dokumentów'
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                description: 'Szybszy i tańszy model, dobry dla podstawowych zadań OCR'
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                description: 'Wydajny model do analizy złożonych dokumentów'
            }
        ];
    }

    /**
     * Określa MIME type na podstawie rozszerzenia pliku
     */
    private getMimeType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.pdf':
                return 'application/pdf';
            case '.png':
                return 'image/png';
            case '.jpg':
            case '.jpeg':
                return 'image/jpeg';
            case '.gif':
                return 'image/gif';
            case '.bmp':
                return 'image/bmp';
            case '.webp':
                return 'image/webp';
            case '.tiff':
            case '.tif':
                return 'image/tiff';
            default:
                return 'application/octet-stream';
        }
    }

    /**
     * Maskuje klucz API dla bezpieczeństwa
     */
    static maskApiKey(apiKey: string): string {
        if (!apiKey || apiKey.length < 8) {
            return '***';
        }
        const start = apiKey.substring(0, 4);
        const end = apiKey.substring(apiKey.length - 4);
        const masked = '*'.repeat(apiKey.length - 8);
        return `${start}${masked}${end}`;
    }
}
