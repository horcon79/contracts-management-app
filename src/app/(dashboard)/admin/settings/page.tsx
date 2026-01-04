'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        openai_api_key: '',
        default_model: 'gpt-4o',
    });
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings');
            if (response.ok) {
                const data = await response.json();
                setSettings({
                    openai_api_key: data.openai_api_key || '',
                    default_model: data.default_model || 'gpt-4o',
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setMessage('Ustawienia zostały zapisane pomyślnie.');
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Ładowanie...</div>;

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold">Ustawienia systemu</h1>
                <p className="text-muted-foreground">Konfiguruj parametry globalne aplikacji</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Integracja AI (OpenAI)
                        </CardTitle>
                        <CardDescription>
                            Skonfiguruj klucz API i domyślny model dla funkcji OCR i analizy umów
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Klucz OpenAI API</Label>
                            <div className="relative">
                                <Input
                                    id="apiKey"
                                    type={showKey ? 'text' : 'password'}
                                    value={settings.openai_api_key}
                                    onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                                    placeholder="sk-..."
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowKey(!showKey)}
                                >
                                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="model">Domyślny Model</Label>
                            <select
                                id="model"
                                value={settings.default_model}
                                onChange={(e) => setSettings({ ...settings, default_model: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="gpt-4o">GPT-4o (Zalecany)</option>
                                <option value="gpt-4o-mini">GPT-4o Mini (Szybszy)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
                    </Button>
                    {message && (
                        <div className="flex items-center gap-2 text-sm text-green-600 animate-in fade-in slide-in-from-left-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {message}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
