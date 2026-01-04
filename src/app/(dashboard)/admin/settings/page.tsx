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
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_pass: '',
        smtp_from: '',
        smtp_secure: 'false',
    });
    const [showKey, setShowKey] = useState(false);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);
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
                    smtp_host: data.smtp_host || '',
                    smtp_port: data.smtp_port || '587',
                    smtp_user: data.smtp_user || '',
                    smtp_pass: data.smtp_pass || '',
                    smtp_from: data.smtp_from || '',
                    smtp_secure: data.smtp_secure || 'false',
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

    const testSmtp = async () => {
        setTestingSmtp(true);
        try {
            const response = await fetch('/api/admin/settings/test-smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage('Połączenie SMTP udane! Testowy e-mail został wysłany.');
            } else {
                setMessage(`Błąd SMTP: ${data.error}`);
            }
            setTimeout(() => setMessage(null), 5000);
        } catch (error) {
            console.error('Error testing SMTP:', error);
            setMessage('Błąd podczas testowania połączenia.');
        } finally {
            setTestingSmtp(false);
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Powiadomienia E-mail (SMTP)
                        </CardTitle>
                        <CardDescription>
                            Skonfiguruj serwer poczty wychodzącej dla powiadomień o nowych i kończących się umowach
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtpHost">Host SMTP</Label>
                                <Input
                                    id="smtpHost"
                                    value={settings.smtp_host}
                                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                                    placeholder="smtp.example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtpPort">Port</Label>
                                <Input
                                    id="smtpPort"
                                    value={settings.smtp_port}
                                    onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                                    placeholder="587"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="smtpUser">Użytkownik</Label>
                            <Input
                                id="smtpUser"
                                value={settings.smtp_user}
                                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                                placeholder="user@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="smtpPass">Hasło</Label>
                            <div className="relative">
                                <Input
                                    id="smtpPass"
                                    type={showSmtpPass ? 'text' : 'password'}
                                    value={settings.smtp_pass}
                                    onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                                    placeholder="••••••••"
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                                >
                                    {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtpFrom">E-mail nadawcy</Label>
                                <Input
                                    id="smtpFrom"
                                    value={settings.smtp_from}
                                    onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
                                    placeholder="no-reply@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtpSecure">Szyfrowanie (SSL/TLS)</Label>
                                <select
                                    id="smtpSecure"
                                    value={settings.smtp_secure}
                                    onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="false">STARTTLS (Zwykle port 587)</option>
                                    <option value="true">SSL/TLS (Zwykle port 465)</option>
                                </select>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={testSmtp}
                            disabled={testingSmtp || !settings.smtp_host}
                            className="w-full"
                        >
                            {testingSmtp ? 'Testowanie...' : 'Testuj połączenie SMTP'}
                        </Button>
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
