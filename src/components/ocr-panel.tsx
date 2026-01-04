'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Bot, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface OCROptions {
    apiKey: string;
    model: string;
    action: 'ocr' | 'summary';
}

interface OCRStatus {
    hasOcrText: boolean;
    hasAiSummary: boolean;
    ocrTextLength: number;
    summaryLength: number;
    lastUpdated: string;
}

interface OCRPanelProps {
    contractId: string;
    ocrText?: string;
    aiSummary?: string;
    onUpdate?: () => void;
}

const AVAILABLE_MODELS = [
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

export function OCRPanel({ contractId, ocrText, aiSummary, onUpdate }: OCRPanelProps) {
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('gpt-4o');
    const [showApiKey, setShowApiKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<OCRStatus | null>(null);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Pobierz status OCR
    const fetchOCRStatus = async () => {
        try {
            const response = await fetch(`/api/contracts/${contractId}/ocr`);
            if (response.ok) {
                const data = await response.json();
                setStatus(data.data);
            }
        } catch (error) {
            console.error('Error fetching OCR status:', error);
        }
    };

    useEffect(() => {
        fetchOCRStatus();
    }, [contractId]);

    const handleOCRAction = async (action: 'ocr' | 'summary') => {
        if (!apiKey.trim()) {
            setError('Klucz API jest wymagany');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`/api/contracts/${contractId}/ocr`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey,
                    model: selectedModel,
                    action
                } as OCROptions),
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                setApiKey(''); // Wyczyść API key po użyciu
                await fetchOCRStatus(); // Odśwież status
                onUpdate?.(); // Powiadom komponent nadrzędny o aktualizacji
            } else {
                setError(data.error || 'Wystąpił błąd podczas przetwarzania');
            }
        } catch (error) {
            console.error('OCR error:', error);
            setError('Wystąpił błąd sieciowy');
        } finally {
            setLoading(false);
        }
    };

    const maskApiKey = (key: string) => {
        if (!key || key.length < 8) return '***';
        const start = key.substring(0, 4);
        const end = key.substring(key.length - 4);
        const masked = '*'.repeat(key.length - 8);
        return `${start}${masked}${end}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    OCR i AI
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status OCR */}
                {status && (
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                            {status.hasOcrText ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">Tekst OCR: {status.ocrTextLength} znaków</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {status.hasAiSummary ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">Podsumowanie AI: {status.summaryLength} znaków</span>
                        </div>
                    </div>
                )}

                {/* Konfiguracja API */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="apiKey">Klucz API OpenAI</Label>
                        <div className="relative">
                            <Input
                                id="apiKey"
                                type={showApiKey ? 'text' : 'password'}
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowApiKey(!showApiKey)}
                            >
                                {showApiKey ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {apiKey && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Masked: {maskApiKey(apiKey)}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="model">Model AI</Label>
                        <select
                            id="model"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            {AVAILABLE_MODELS.map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.name} - {model.description}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Akcje OCR */}
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleOCRAction('ocr')}
                            disabled={loading || !apiKey.trim()}
                            className="flex-1"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="mr-2 h-4 w-4" />
                            )}
                            {loading ? 'Przetwarzanie...' : 'Wyodrębnij tekst (OCR)'}
                        </Button>

                        <Button
                            onClick={() => handleOCRAction('summary')}
                            disabled={loading || !apiKey.trim() || !status?.hasOcrText}
                            variant="secondary"
                            className="flex-1"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Bot className="mr-2 h-4 w-4" />
                            )}
                            Generuj podsumowanie
                        </Button>
                    </div>

                    {!status?.hasOcrText && (
                        <p className="text-xs text-muted-foreground">
                            Najpierw wykonaj OCR, aby wyodrębnić tekst z PDF
                        </p>
                    )}
                </div>

                {/* Błędy */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Wyniki */}
                {result && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            {result.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium">
                                {result.success ? 'Sukces!' : 'Błąd'}
                            </span>
                        </div>

                        {result.data?.extractedText && (
                            <div>
                                <Label className="text-sm font-medium">Wynik:</Label>
                                <div className="mt-1 p-3 rounded-lg bg-muted/50 max-h-40 overflow-y-auto">
                                    <p className="text-sm whitespace-pre-wrap">
                                        {result.data.extractedText}
                                    </p>
                                </div>
                            </div>
                        )}

                        {result.maskedApiKey && (
                            <p className="text-xs text-muted-foreground">
                                Użyty API key: {result.maskedApiKey}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
