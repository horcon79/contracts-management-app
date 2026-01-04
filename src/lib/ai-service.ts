import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ContractDescription {
    description: string;
    keyPoints: string[];
    contractType?: string;
    client?: string;
    value?: number;
    dates?: {
        contractDate?: Date;
        startDate?: Date;
        endDate?: Date;
    };
}

export async function generateContractDescription(
    contractText: string,
    originalFileName: string
): Promise<ContractDescription> {
    try {
        const prompt = `
Przeanalizuj poniższy tekst umowy i wygeneruj szczegółowy opis w języku polskim. 
Uwzględnij następujące elementy:

1. Krótki, ale szczegółowy opis głównego celu i treści umowy (2-3 zdania)
2. Kluczowe punkty i zobowiązania stron
3. Typ umowy (jeśli można określić)
4. Nazwa klienta/kontrahenta
5. Wartość umowy (jeśli podana)
6. Kluczowe daty (data zawarcia, rozpoczęcia, zakończenia)

Nazwa pliku: ${originalFileName}

Tekst umowy:
${contractText}

Odpowiedź podaj w formacie JSON z następującymi polami:
{
  "description": "szczegółowy opis umowy",
  "keyPoints": ["punkt1", "punkt2", "punkt3"],
  "contractType": "typ umowy (opcjonalnie)",
  "client": "nazwa klienta (opcjonalnie)",
  "value": "wartość umowy (opcjonalnie)",
  "dates": {
    "contractDate": "data zawarcia (opcjonalnie)",
    "startDate": "data rozpoczęcia (opcjonalnie)",
    "endDate": "data zakończenia (opcjonalnie)"
  }
}
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Jesteś ekspertem prawnym specjalizującym się w analizie umów. Twoim zadaniem jest tworzenie szczegółowych, ale zwięzłych opisów umów w języku polskim. Zawsze odpowiadaj w formacie JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Brak odpowiedzi od AI');
        }

        // Parse JSON response
        try {
            const parsedResponse = JSON.parse(content);
            return {
                description: parsedResponse.description || '',
                keyPoints: parsedResponse.keyPoints || [],
                contractType: parsedResponse.contractType,
                client: parsedResponse.client,
                value: parsedResponse.value ? parseFloat(parsedResponse.value) : undefined,
                dates: parsedResponse.dates || {},
            };
        } catch (parseError) {
            // If JSON parsing fails, create a basic description
            return {
                description: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
                keyPoints: [],
            };
        }
    } catch (error) {
        console.error('Error generating contract description:', error);
        throw new Error('Nie udało się wygenerować opisu umowy');
    }
}

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    // This would typically use a PDF parsing library like pdf-parse
    // For now, we'll return a placeholder
    try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(pdfBuffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Nie udało się wyodrębnić tekstu z PDF');
    }
}
