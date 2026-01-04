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
    originalFileName: string,
    options?: { apiKey?: string; model?: string }
): Promise<ContractDescription> {
    try {
        const client = options?.apiKey ? new OpenAI({ apiKey: options.apiKey }) : openai;
        const model = options?.model || "gpt-4o-mini";
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

        const response = await client.chat.completions.create({
            model: model,
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
            max_tokens: 2000,
        });

        let content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Brak odpowiedzi od AI');
        }

        // Clean up markdown code blocks if present to ensure valid JSON parsing
        content = content.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

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
            console.warn('Failed to parse AI JSON, falling back to raw text:', parseError);
            // If JSON parsing fails, return the full content as description without truncation
            // We strip the braces if it looks like failed JSON to make it cleaner
            const cleanContent = content.trim();
            return {
                description: cleanContent,
                keyPoints: [],
            };
        }
    } catch (error) {
        console.error('Error generating contract description:', error);
        throw new Error('Nie udało się wygenerować opisu umowy');
    }
}
