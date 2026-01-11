'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PDFViewer } from '@/components/pdf/PDFViewer';

interface DictionaryItem {
    _id: string;
    name: string;
    color: string;
    metadata?: Record<string, any>;
}

export default function UploadContractPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const [clients, setClients] = useState<DictionaryItem[]>([]);
    const [types, setTypes] = useState<DictionaryItem[]>([]);
    const [statuses, setStatuses] = useState<DictionaryItem[]>([]);
    const [persons, setPersons] = useState<DictionaryItem[]>([]);
    const [categories, setCategories] = useState<DictionaryItem[]>([]);
    const [companies, setCompanies] = useState<DictionaryItem[]>([]);
    const [customFields, setCustomFields] = useState<DictionaryItem[]>([]);

    const [metadata, setMetadata] = useState<Record<string, string>>({
        company: '',
        client: '',
        contractType: '',
        status: '',
        responsiblePerson: '',
        category: '',
        value: '',
        contractDate: '',
        startDate: '',
        endDate: '',
    });

    // Client modal state
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientMetadata, setNewClientMetadata] = useState<Record<string, any>>({});
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    useEffect(() => {
        fetchDictionaries();
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, []);

    const fetchDictionaries = async () => {
        const types = ['clients', 'types', 'statuses', 'persons', 'categories', 'fields', 'companies'];
        const results = await Promise.all(
            types.map((type) => fetch(`/api/dictionaries?type=${type}`).then((r) => r.json()))
        );
        setClients(results[0]);
        setTypes(results[1]);
        setStatuses(results[2]);
        setPersons(results[3]);
        setCategories(results[4]);
        setCustomFields(results[5]);
        setCompanies(results[6]);
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                setFile(droppedFile);
                const url = URL.createObjectURL(droppedFile);
                setPreviewUrl(url);
                if (!title) {
                    setTitle(droppedFile.name.replace('.pdf', ''));
                }
            }
        }
    }, [title, previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
            if (!title) {
                setTitle(selectedFile.name.replace('.pdf', ''));
            }
        }
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientName.trim()) return;

        setIsCreatingClient(true);
        try {
            const response = await fetch('/api/dictionaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'clients',
                    name: newClientName,
                    metadata: newClientMetadata
                }),
            });

            if (response.ok) {
                const newClient = await response.json();
                await fetchDictionaries(); // Refresh list
                setMetadata({ ...metadata, client: newClient.name });
                setIsClientModalOpen(false);
                setNewClientName('');
                setNewClientMetadata({});
                toast.success('Dodano nowego klienta');
            } else {
                toast.error('Nie udało się dodać klienta');
            }
        } catch (error) {
            console.error('Error creating client:', error);
            toast.error('Błąd podczas tworzenia klienta');
        } finally {
            setIsCreatingClient(false);
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);

        try {
            // Upload file
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch('/api/contracts/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            const uploadData = await uploadResponse.json();

            // Create contract
            const contractResponse = await fetch('/api/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    pdfPath: uploadData.path,
                    originalFileName: uploadData.originalName,
                    metadata: {
                        ...metadata,
                        value: metadata.value ? parseFloat(metadata.value) : undefined,
                        contractDate: metadata.contractDate || undefined,
                        startDate: metadata.startDate || undefined,
                        endDate: metadata.endDate || undefined,
                    },
                }),
            });

            if (!contractResponse.ok) {
                throw new Error('Failed to create contract');
            }

            const contract = await contractResponse.json();
            router.push(`/contracts/${contract._id}`);
        } catch (error) {
            console.error('Error creating contract:', error);
            alert('Wystąpił błąd podczas tworzenia umowy');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={`space-y-6 ${file ? 'max-w-full' : 'max-w-4xl mx-auto'}`}>
            <div className={file ? 'px-4 lg:px-8' : ''}>
                <h1 className="text-3xl font-bold">Dodaj nową umowę</h1>
                <p className="text-muted-foreground">Prześlij plik PDF i uzupełnij dane umowy</p>
            </div>

            <div className={`grid gap-6 ${file ? 'lg:grid-cols-2' : ''} ${file ? 'px-4 lg:px-8' : ''}`}>
                <div className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Plik PDF</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {file ? (
                                        <div className="flex items-center justify-center gap-4">
                                            <FileText className="h-8 w-8 text-primary" />
                                            <div className="text-left">
                                                <p className="font-medium">{file.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setFile(null);
                                                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                    setPreviewUrl(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground mb-2">
                                                Przeciągnij plik PDF lub kliknij aby wybrać
                                            </p>
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <Label
                                                htmlFor="file-upload"
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
                                            >
                                                Wybierz plik
                                            </Label>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Dane umowy</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Tytuł umowy *</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Wprowadź tytuł umowy"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company">Nasza Firma (podmiot umowy)</Label>
                                    <select
                                        id="company"
                                        value={metadata.company}
                                        onChange={(e) => setMetadata({ ...metadata, company: e.target.value })}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Wybierz firmę</option>
                                        {companies.map((c) => (
                                            <option key={c._id} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="client">Klient</Label>
                                        <select
                                            id="client"
                                            value={metadata.client}
                                            onChange={(e) => {
                                                const selectedClientName = e.target.value;
                                                if (selectedClientName === 'ADD_NEW') {
                                                    setIsClientModalOpen(true);
                                                } else {
                                                    const selectedClient = clients.find(c => c.name === selectedClientName);
                                                    let newMetadata: Record<string, string> = { ...metadata, client: selectedClientName };

                                                    if (selectedClient?.metadata) {
                                                        customFields.forEach(field => {
                                                            // Only autofill if the field exists in client metadata
                                                            // This allows keeping manually entered values for non-client fields
                                                            if (selectedClient.metadata && selectedClient.metadata[field.name]) {
                                                                newMetadata[field.name] = String(selectedClient.metadata[field.name]);
                                                            }
                                                        });
                                                    }
                                                    setMetadata(newMetadata);
                                                }
                                            }}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">Wybierz klienta</option>
                                            <option value="ADD_NEW" className="font-bold text-primary">* Dodaj nowego kontrahenta *</option>
                                            {clients.map((c) => (
                                                <option key={c._id} value={c.name}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type">Typ umowy</Label>
                                        <select
                                            id="type"
                                            value={metadata.contractType}
                                            onChange={(e) => setMetadata({ ...metadata, contractType: e.target.value })}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">Wybierz typ</option>
                                            {types.map((t) => (
                                                <option key={t._id} value={t.name}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <select
                                            id="status"
                                            value={metadata.status}
                                            onChange={(e) => setMetadata({ ...metadata, status: e.target.value })}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">Wybierz status</option>
                                            {statuses.map((s) => (
                                                <option key={s._id} value={s.name}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="person">Osoba odpowiedzialna</Label>
                                        <select
                                            id="person"
                                            value={metadata.responsiblePerson}
                                            onChange={(e) => setMetadata({ ...metadata, responsiblePerson: e.target.value })}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">Wybierz osobę</option>
                                            {persons.map((p) => (
                                                <option key={p._id} value={p.name}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Kategoria</Label>
                                        <select
                                            id="category"
                                            value={metadata.category}
                                            onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">Wybierz kategorię</option>
                                            {categories.map((c) => (
                                                <option key={c._id} value={c.name}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="value">Wartość umowy (PLN)</Label>
                                        <Input
                                            id="value"
                                            type="number"
                                            value={metadata.value}
                                            onChange={(e) => setMetadata({ ...metadata, value: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contractDate">Data zawarcia</Label>
                                        <Input
                                            id="contractDate"
                                            type="date"
                                            value={metadata.contractDate}
                                            onChange={(e) => setMetadata({ ...metadata, contractDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Data rozpoczęcia</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={metadata.startDate}
                                            onChange={(e) => setMetadata({ ...metadata, startDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">Data zakończenia</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={metadata.endDate}
                                            onChange={(e) => setMetadata({ ...metadata, endDate: e.target.value })}
                                        />
                                    </div>

                                    {/* Dynamiczne pola ze Słowników - tylko te przypisane do Klientów (ogólne metadane umowy) */}
                                    {customFields
                                        .filter(f => !f.metadata?.targetType || f.metadata?.targetType === 'clients')
                                        .map((field) => (
                                            <div key={field._id} className="space-y-2">
                                                <Label htmlFor={`custom-${field._id}`}>{field.name}</Label>
                                                <Input
                                                    id={`custom-${field._id}`}
                                                    value={metadata[field.name] || ''}
                                                    onChange={(e) => setMetadata({ ...metadata, [field.name]: e.target.value })}
                                                    placeholder={`Wprowadź ${field.name.toLowerCase()}`}
                                                />
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Anuluj
                            </Button>
                            <Button type="submit" disabled={!file || !title || uploading}>
                                {uploading ? 'Przesyłanie...' : 'Zapisz umowę'}
                            </Button>
                        </div>
                    </form>
                </div>

                {file && previewUrl && (
                    <div className="hidden lg:block sticky top-6 h-[calc(100vh-120px)]">
                        <Card className="h-full overflow-hidden flex flex-col">
                            <CardHeader className="py-3 px-4 border-b">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Podgląd PDF
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                <PDFViewer file={previewUrl} />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Modal dodawania klienta */}
            {isClientModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-white dark:bg-zinc-950 border shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>Dodaj nowego klienta</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsClientModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddClient} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-client-name">Nazwa klienta *</Label>
                                    <Input
                                        id="new-client-name"
                                        value={newClientName}
                                        onChange={(e) => setNewClientName(e.target.value)}
                                        placeholder="Nazwa firmy lub imię i nazwisko"
                                        required
                                    />
                                </div>

                                {customFields
                                    .filter(f => f.metadata?.targetType === 'clients')
                                    .map(field => (
                                        <div key={field._id} className="space-y-2">
                                            <Label htmlFor={`modal-${field._id}`}>{field.name}</Label>
                                            <Input
                                                id={`modal-${field._id}`}
                                                type={field.metadata?.dataType === 'date' ? 'date' :
                                                    field.metadata?.dataType === 'number' ? 'number' : 'text'}
                                                value={newClientMetadata[field.name] || ''}
                                                onChange={(e) => setNewClientMetadata({ ...newClientMetadata, [field.name]: e.target.value })}
                                                placeholder={`Wprowadź ${field.name.toLowerCase()}`}
                                            />
                                        </div>
                                    ))
                                }

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setIsClientModalOpen(false)}
                                    >
                                        Anuluj
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={!newClientName.trim() || isCreatingClient}
                                    >
                                        {isCreatingClient ? 'Zapisywanie...' : 'Zapisz klienta'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
