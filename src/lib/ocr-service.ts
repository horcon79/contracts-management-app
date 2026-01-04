import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

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
     * Ekstraktuje tekst z pliku PDF używając OpenAI Vision API
     */
    async extractTextFromPDF(filePath: string, options: OCROptions): Promise<OCRResult> {
        try {
            // Sprawdź czy plik istnieje
            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: 'Plik nie został znaleziony'
                };
            }

            // Odczytaj plik jako base64
            const fileBuffer = fs.readFileSync(filePath);
            const base64Content = fileBuffer.toString('base64');
            const mimeType = this.getMimeType(filePath);

            const response = await this.openai.chat.completions.create({
                model: options.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Proszę wyodrębnić cały tekst z tego dokumentu PDF. Zachowaj formatowanie, strukturę i wszystkie informacje. Jeśli dokument zawiera tabele, zachowaj ich strukturę. Zwróć tylko wyodrębniony tekst bez dodatkowych komentarzy.'
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

            const extractedText = response.choices[0]?.message?.content;

            if (!extractedText) {
                return {
                    success: false,
                    error: 'Nie udało się wyodrębnić tekstu z dokumentu'
                };
            }

            return {
                success: true,
                extractedText,
                modelUsed: options.model
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
                        content: 'Jesteś ekspertem prawnym. Przeanalizuj tekst umowy i stwórz profesjonalne podsumowanie zawierające: kluczowe warunki, daty, strony umowy, obowiązki, prawa, ograniczenia i ryzyka.'
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
