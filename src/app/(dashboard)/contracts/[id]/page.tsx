'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft, Trash2, Send, Bot, MessageCircle, Sparkles, Loader2, Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { OCRPanel } from '@/components/ocr-panel';
import { PDFViewer } from '@/components/pdf/PDFViewer';

interface Contract {
    _id: string;
    title: string;
    pdfPath: string;
    originalFileName: string;
    ocrText?: string;
    description?: string;
    aiSummary?: string;
    metadata: {
        contractDate?: string;
        startDate?: string;
        endDate?: string;
        client?: string;
        contractType?: string;
        status?: string;
        value?: number;
        responsiblePerson?: string;
        category?: string;
    };
    createdBy?: {
        name: string;
        email: string;
    };
    createdAt: string;
}

interface Note {
    _id: string;
    content: string;
    authorName: string;
    createdAt: string;
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: session } = useSession();
    const [contract, setContract] = useState<Contract | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);
    const [description, setDescription] = useState('');
    const [generatingDescription, setGeneratingDescription] = useState(false);
    const [savingDescription, setSavingDescription] = useState(false);
    const [clientDetails, setClientDetails] = useState<any>(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editMetadata, setEditMetadata] = useState<Record<string, any>>({});
    const [dictionaries, setDictionaries] = useState<{
        clients: any[];
        types: any[];
        statuses: any[];
        persons: any[];
        categories: any[];
        customFields: any[];
    }>({
        clients: [],
        types: [],
        statuses: [],
        persons: [],
        categories: [],
        customFields: []
    });

    useEffect(() => {
        fetchContract();
        fetchNotes();
        fetchDictionaries();
    }, [id]);

    useEffect(() => {
        if (contract) {
            setDescription(contract.description || '');
            if (contract.metadata.client) {
                fetchClientDetails(contract.metadata.client);
            }
        }
    }, [contract]);

    useEffect(() => {
        if (isEditing && contract) {
            setEditMetadata({
                ...contract.metadata
            });
        }
    }, [isEditing, contract]);

    const fetchContract = async () => {
        try {
            const response = await fetch(`/api/contracts/${id}`);
            if (response.ok) {
                const data = await response.json();
                setContract(data);
            }
        } catch (error) {
            console.error('Error fetching contract:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotes = async () => {
        try {
            const response = await fetch(`/api/contracts/${id}/notes`);
            if (response.ok) {
                const data = await response.json();
                setNotes(data);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    const fetchDictionaries = async () => {
        try {
            const types = ['clients', 'types', 'statuses', 'persons', 'categories', 'fields'];
            const results = await Promise.all(
                types.map(type => fetch(`/api/dictionaries?type=${type}`).then(res => res.json()))
            );

            setDictionaries({
                clients: results[0],
                types: results[1],
                statuses: results[2],
                persons: results[3],
                categories: results[4],
                customFields: results[5]
            });
        } catch (error) {
            console.error('Error fetching dictionaries:', error);
        }
    };

    const handleSaveMetadata = async () => {
        if (!contract) return;

        try {
            const response = await fetch(`/api/contracts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metadata: editMetadata
                }),
            });

            if (response.ok) {
                const updated = await response.json();
                setContract(updated);
                setIsEditing(false);
                toast.success('Dane umowy zostały zaktualizowane');
            } else {
                toast.error('Nie udało się zapisać zmian');
            }
        } catch (error) {
            console.error('Error updating contract:', error);
            toast.error('Wystąpił błąd');
        }
    };

    const fetchClientDetails = async (clientName: string) => {
        try {
            const response = await fetch(`/api/dictionaries?type=clients`);
            if (response.ok) {
                const clients = await response.json();
                const client = clients.find((c: any) => c.name === clientName);
                if (client) {
                    setClientDetails(client);
                }
            }
        } catch (error) {
            console.error('Error fetching client details:', error);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        setAddingNote(true);
        try {
            const response = await fetch(`/api/contracts/${id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newNote }),
            });

            if (response.ok) {
                setNewNote('');
                fetchNotes();
            }
        } catch (error) {
            console.error('Error adding note:', error);
        } finally {
            setAddingNote(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!contract) return;

        setGeneratingDescription(true);
        try {
            const response = await fetch(`/api/contracts/${id}/generate-description`, {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                setDescription(data.description);
                // Odśwież dane umowy
                fetchContract();
            } else {
                const error = await response.json();
                alert(`Błąd: ${error.error}`);
            }
        } catch (error) {
            console.error('Error generating description:', error);
            alert('Wystąpił błąd podczas generowania opisu');
        } finally {
            setGeneratingDescription(false);
        }
    };

    const handleSaveDescription = async () => {
        if (!contract || !description.trim()) return;

        setSavingDescription(true);
        try {
            const response = await fetch(`/api/contracts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description }),
            });

            if (response.ok) {
                fetchContract();
                alert('Opis został zapisany');
            } else {
                const error = await response.json();
                alert(`Błąd: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving description:', error);
            alert('Wystąpił błąd podczas zapisywania opisu');
        } finally {
            setSavingDescription(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Czy na pewno chcesz usunąć tę umowę?')) return;

        try {
            const response = await fetch(`/api/contracts/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                router.push('/contracts');
            }
        } catch (error) {
            console.error('Error deleting contract:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Ładowanie...</p>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Nie znaleziono umowy</p>
                <Button onClick={() => router.push('/contracts')} className="mt-4">
                    Wróć do listy
                </Button>
            </div>
        );
    }

    const canEdit = session?.user?.role !== 'read';
    const canDelete = session?.user?.role === 'admin';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{contract.title}</h1>
                        <p className="text-muted-foreground">{contract.originalFileName}</p>
                    </div>
                </div>
                {canDelete && (
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usuń
                    </Button>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Przeglądarka PDF
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="h-[600px]">
                                <PDFViewer
                                    file={contract.pdfPath}
                                    onLoadSuccess={(numPages) => console.log(`PDF loaded with ${numPages} pages`)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Opis umowy */}
                    {canEdit && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Opis umowy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="description">Opis umowy</Label>
                                    <textarea
                                        id="description"
                                        className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Wprowadź opis umowy..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleGenerateDescription}
                                        disabled={generatingDescription}
                                        variant="outline"
                                    >
                                        {generatingDescription ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        {generatingDescription ? 'Generowanie...' : 'Wygeneruj opis przez AI'}
                                    </Button>
                                    <Button
                                        onClick={handleSaveDescription}
                                        disabled={savingDescription || !description.trim()}
                                    >
                                        {savingDescription ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        {savingDescription ? 'Zapisywanie...' : 'Zapisz opis'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Wyświetlanie opisu (tylko do odczytu) */}
                    {!canEdit && contract.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Opis umowy
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{contract.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* OCR Panel */}
                    {canEdit && (
                        <OCRPanel
                            contractId={contract._id}
                            ocrText={contract.ocrText}
                            aiSummary={contract.aiSummary}
                            onUpdate={fetchContract}
                        />
                    )}

                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Szczegóły umowy</CardTitle>
                                {canEdit && (
                                    isEditing ? (
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={handleSaveMetadata}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Typ umowy</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            value={editMetadata.contractType || ''}
                                            onChange={(e) => setEditMetadata({ ...editMetadata, contractType: e.target.value })}
                                        >
                                            <option value="">Wybierz typ</option>
                                            {dictionaries.types.map((t) => (
                                                <option key={t._id} value={t.name}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Klient</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            value={editMetadata.client || ''}
                                            onChange={(e) => setEditMetadata({ ...editMetadata, client: e.target.value })}
                                        >
                                            <option value="">Wybierz klienta</option>
                                            {dictionaries.clients.map((c) => (
                                                <option key={c._id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            value={editMetadata.status || ''}
                                            onChange={(e) => setEditMetadata({ ...editMetadata, status: e.target.value })}
                                        >
                                            <option value="">Wybierz status</option>
                                            {dictionaries.statuses.map((s) => (
                                                <option key={s._id} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Osoba odpowiedzialna</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            value={editMetadata.responsiblePerson || ''}
                                            onChange={(e) => setEditMetadata({ ...editMetadata, responsiblePerson: e.target.value })}
                                        >
                                            <option value="">Wybierz osobę</option>
                                            {dictionaries.persons.map((p) => (
                                                <option key={p._id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Kategoria</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            value={editMetadata.category || ''}
                                            onChange={(e) => setEditMetadata({ ...editMetadata, category: e.target.value })}
                                        >
                                            <option value="">Wybierz kategorię</option>
                                            {dictionaries.categories.map((c) => (
                                                <option key={c._id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Wartość</Label>
                                        <Input
                                            type="number"
                                            value={editMetadata.value || ''}
                                            onChange={(e) => setEditMetadata({ ...editMetadata, value: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Data zawarcia</Label>
                                        <Input
                                            type="date"
                                            value={editMetadata.contractDate ? new Date(editMetadata.contractDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditMetadata({ ...editMetadata, contractDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Data rozpoczęcia</Label>
                                        <Input
                                            type="date"
                                            value={editMetadata.startDate ? new Date(editMetadata.startDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditMetadata({ ...editMetadata, startDate: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Data zakończenia</Label>
                                        <Input
                                            type="date"
                                            value={editMetadata.endDate ? new Date(editMetadata.endDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditMetadata({ ...editMetadata, endDate: e.target.value })}
                                        />
                                    </div>

                                    {dictionaries.customFields.map((field) => (
                                        <div key={field._id} className="space-y-2">
                                            <Label>{field.name}</Label>
                                            <Input
                                                value={editMetadata[field.name] || ''}
                                                onChange={(e) => setEditMetadata({ ...editMetadata, [field.name]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {contract.metadata.client && (
                                            <div className="col-span-2 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                                                <Label className="text-blue-800 font-semibold mb-1 block">Klient</Label>
                                                <p className="text-lg font-bold text-blue-900">{contract.metadata.client}</p>
                                                {clientDetails?.metadata && Object.keys(clientDetails.metadata).length > 0 && (
                                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-blue-800/80">
                                                        {Object.entries(clientDetails.metadata).map(([key, value]) => {
                                                            if (!value) return null;
                                                            return (
                                                                <div key={key} className="sm:col-span-2">
                                                                    <span className="font-medium capitalize">{key}:</span> {value as string}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {contract.metadata.contractType && (
                                            <div>
                                                <Label className="text-muted-foreground">Typ umowy</Label>
                                                <p className="font-medium">{contract.metadata.contractType}</p>
                                            </div>
                                        )}
                                        {contract.metadata.status && (
                                            <div>
                                                <Label className="text-muted-foreground">Status</Label>
                                                <p className="font-medium">{contract.metadata.status}</p>
                                            </div>
                                        )}
                                        {contract.metadata.category && (
                                            <div>
                                                <Label className="text-muted-foreground">Kategoria</Label>
                                                <p className="font-medium">{contract.metadata.category}</p>
                                            </div>
                                        )}
                                        {contract.metadata.value && (
                                            <div>
                                                <Label className="text-muted-foreground">Wartość</Label>
                                                <p className="font-medium">{formatCurrency(contract.metadata.value)}</p>
                                            </div>
                                        )}
                                        {contract.metadata.responsiblePerson && (
                                            <div>
                                                <Label className="text-muted-foreground">Osoba odpowiedzialna</Label>
                                                <p className="font-medium">{contract.metadata.responsiblePerson}</p>
                                            </div>
                                        )}
                                        {contract.metadata.contractDate && (
                                            <div>
                                                <Label className="text-muted-foreground">Data zawarcia</Label>
                                                <p className="font-medium">{formatDate(contract.metadata.contractDate)}</p>
                                            </div>
                                        )}
                                        {contract.metadata.startDate && (
                                            <div>
                                                <Label className="text-muted-foreground">Data rozpoczęcia</Label>
                                                <p className="font-medium">{formatDate(contract.metadata.startDate)}</p>
                                            </div>
                                        )}
                                        {contract.metadata.endDate && (
                                            <div>
                                                <Label className="text-muted-foreground">Data zakończenia</Label>
                                                <p className="font-medium">{formatDate(contract.metadata.endDate)}</p>
                                            </div>
                                        )}

                                        {/* Dynamiczne pola dodatkowe */}
                                        {Object.entries(contract.metadata).map(([key, value]) => {
                                            // Pomiń pola już obsłużone powyżej
                                            const hardcodedFields = ['client', 'contractType', 'status', 'category', 'value', 'responsiblePerson', 'contractDate', 'startDate', 'endDate'];
                                            if (hardcodedFields.includes(key) || !value) return null;

                                            return (
                                                <div key={key}>
                                                    <Label className="text-muted-foreground">{key}</Label>
                                                    <p className="font-medium">{value as string}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-4 border-t">
                                        <div className="grid gap-4 sm:grid-cols-2 text-sm">
                                            <div>
                                                <Label className="text-muted-foreground">Dodano</Label>
                                                <p>{formatDate(contract.createdAt)}</p>
                                            </div>
                                            {contract.createdBy && (
                                                <div>
                                                    <Label className="text-muted-foreground">Przez</Label>
                                                    <p>{contract.createdBy.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {contract.aiSummary && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5" />
                                    Podsumowanie AI
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{contract.aiSummary}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Notatki ({notes.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {canEdit && (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Dodaj notatkę..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                    />
                                    <Button onClick={handleAddNote} disabled={addingNote || !newNote.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {notes.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Brak notatek
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {notes.map((note) => (
                                        <div key={note._id} className="p-3 rounded-lg bg-muted/50">
                                            <p className="text-sm">{note.content}</p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {note.authorName} • {formatDate(note.createdAt)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
