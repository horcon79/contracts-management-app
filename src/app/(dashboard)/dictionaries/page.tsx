'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

type DictionaryType = 'clients' | 'types' | 'statuses' | 'persons' | 'categories' | 'fields' | 'companies';

interface DictionaryItem {
    _id: string;
    type: DictionaryType;
    name: string;
    color: string;
    isActive: boolean;
    metadata?: Record<string, any>;
}

const dictionaryTypes: { value: DictionaryType; label: string }[] = [
    { value: 'clients', label: 'Klienci' },
    { value: 'types', label: 'Typy umów' },
    { value: 'statuses', label: 'Statusy' },
    { value: 'persons', label: 'Osoby odpowiedzialne' },
    { value: 'categories', label: 'Kategorie' },
    { value: 'companies', label: 'Nasze Firmy' },
    { value: 'fields', label: 'Dodatkowe pola' },
];

export default function DictionariesPage() {
    const [selectedType, setSelectedType] = useState<DictionaryType>('clients');
    const [items, setItems] = useState<DictionaryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#6B7280');
    const [newMetadata, setNewMetadata] = useState<Record<string, string>>({
        targetType: 'clients',
        dataType: 'text'
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editMetadata, setEditMetadata] = useState<Record<string, string>>({});

    const [allFieldDefs, setAllFieldDefs] = useState<DictionaryItem[]>([]);
    const [editingMetadata, setEditingMetadata] = useState<Record<string, any>>({});
    const [isAddingField, setIsAddingField] = useState(false);

    useEffect(() => {
        fetchItems();
        if (selectedType !== 'fields') {
            fetchFieldDefinitions();
        }
    }, [selectedType]);

    const fetchFieldDefinitions = async () => {
        try {
            const response = await fetch('/api/dictionaries?type=fields');
            if (response.ok) {
                const data = await response.json();
                setAllFieldDefs(data);
            }
        } catch (error) {
            console.error('Error fetching field definitions:', error);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/dictionaries?type=${selectedType}`);
            if (response.ok) {
                const data = await response.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Error fetching dictionaries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;

        try {
            const response = await fetch('/api/dictionaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: selectedType,
                    name: newName,
                    color: newColor,
                    metadata: newMetadata
                }),
            });

            if (response.ok) {
                setNewName('');
                setNewColor('#6B7280');
                setNewMetadata({
                    targetType: 'clients',
                    dataType: 'text'
                });
                fetchItems();
                toast.success('Pomyślnie dodano element');
            } else {
                const errorData = await response.json();
                toast.error(`Błąd: ${errorData.error || 'Nie udało się dodać elementu'}`);
            }
        } catch (error) {
            console.error('Error adding dictionary item:', error);
            toast.error('Wystąpił nieoczekiwany błąd');
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            const response = await fetch(`/api/dictionaries/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    color: editColor,
                    metadata: editMetadata
                }),
            });

            if (response.ok) {
                setEditingId(null);
                fetchItems();
                toast.success('Zaktualizowano element');
            }
        } catch (error) {
            console.error('Error updating dictionary item:', error);
        }
    };

    const handleDelete = async (id: string) => {
        // Remove confirm alert and use toast with undo or just simple delete for now, 
        // but user asked for "attractive form". Sonner handles this well.
        // For now, let's just do a direct delete or keep confirm but move it to a custom UI dialog? 
        // The user specifically disliked the alerts. Browser confirm is also an alert.
        // I'll stick to browser confirm for SAFETY for now (unless asked to change that too), 
        // but definitely replace the success notice. The request said "commuicating about ADDING a record".
        if (!confirm('Czy na pewno chcesz usunąć ten element?')) return;

        try {
            const response = await fetch(`/api/dictionaries/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchItems();
                toast.success('Usunięto element');
            }
        } catch (error) {
            console.error('Error deleting dictionary item:', error);
        }
    };

    const startEditing = (item: DictionaryItem) => {
        setEditingId(item._id);
        setEditName(item.name);
        setEditColor(item.color);
        setEditMetadata(item.metadata || {});
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Słowniki</h1>
                <p className="text-muted-foreground">Zarządzaj słownikami aplikacji</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {dictionaryTypes.map((type) => (
                    <Button
                        key={type.value}
                        variant={selectedType === type.value ? 'default' : 'outline'}
                        onClick={() => setSelectedType(type.value)}
                    >
                        {type.label}
                    </Button>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Dodaj nowy element</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nazwa</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Wprowadź nazwę..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="color">Kolor</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    className="w-16 h-9 p-1"
                                />
                                <Input
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    placeholder="#6B7280"
                                />
                            </div>
                        </div>

                        {/* Dynamic fields for current selectedType */}
                        {selectedType !== 'fields' && allFieldDefs
                            .filter(f => f.metadata?.targetType === selectedType)
                            .map(field => (
                                <div key={field._id} className="space-y-2">
                                    <Label htmlFor={`new-${field._id}`}>{field.name}</Label>
                                    <Input
                                        id={`new-${field._id}`}
                                        type={field.metadata?.dataType === 'date' ? 'date' :
                                            field.metadata?.dataType === 'number' ? 'number' : 'text'}
                                        value={newMetadata[field.name] || ''}
                                        onChange={(e) => setNewMetadata({ ...newMetadata, [field.name]: e.target.value })}
                                        placeholder={field.metadata?.dataType === 'currency' ? '0.00' : `Wprowadź ${field.name.toLowerCase()}...`}
                                    />
                                </div>
                            ))
                        }

                        {/* Special handling for 'fields' type to define new fields */}
                        {selectedType === 'fields' && (
                            <div className="space-y-4 pt-2 border-t">
                                <p className="text-sm font-medium">Definicja pola</p>
                                <div className="space-y-2">
                                    <Label htmlFor="targetType">Dotyczy słownika</Label>
                                    <select
                                        id="targetType"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={newMetadata.targetType || 'clients'}
                                        onChange={(e) => setNewMetadata({ ...newMetadata, targetType: e.target.value })}
                                    >
                                        {dictionaryTypes.filter(t => t.value !== 'fields').map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dataType">Typ danych</Label>
                                    <select
                                        id="dataType"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={newMetadata.dataType || 'text'}
                                        onChange={(e) => setNewMetadata({ ...newMetadata, dataType: e.target.value })}
                                    >
                                        <option value="text">Tekst</option>
                                        <option value="number">Liczba</option>
                                        <option value="date">Data</option>
                                        <option value="currency">Waluta</option>
                                        <option value="email">Email</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        <Button onClick={handleAdd} className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Dodaj
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {dictionaryTypes.find((t) => t.value === selectedType)?.label}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-muted-foreground">Ładowanie...</p>
                        ) : items.length === 0 ? (
                            <p className="text-muted-foreground">Brak elementów</p>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div
                                        key={item._id}
                                        className="flex items-center gap-2 p-2 rounded-md border"
                                    >
                                        {editingId === item._id ? (
                                            <>
                                                <div className="flex flex-col flex-1 gap-2">
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="color"
                                                            value={editColor}
                                                            onChange={(e) => setEditColor(e.target.value)}
                                                            className="w-10 h-8 p-1"
                                                        />
                                                        <Input
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="flex-1"
                                                        />
                                                    </div>

                                                    {/* Dynamic fields for editing */}
                                                    {selectedType !== 'fields' && allFieldDefs
                                                        .filter(f => f.metadata?.targetType === selectedType)
                                                        .map(field => (
                                                            <div key={field._id} className="flex items-center gap-2">
                                                                <Label className="w-24 text-xs">{field.name}:</Label>
                                                                <Input
                                                                    type={field.metadata?.dataType === 'date' ? 'date' :
                                                                        field.metadata?.dataType === 'number' ? 'number' : 'text'}
                                                                    value={editMetadata[field.name] || ''}
                                                                    onChange={(e) => setEditMetadata({ ...editMetadata, [field.name]: e.target.value })}
                                                                    className="h-8 text-sm"
                                                                />
                                                            </div>
                                                        ))
                                                    }

                                                    {selectedType === 'fields' && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <Label className="text-[10px]">Typ danych</Label>
                                                                <select
                                                                    className="w-full rounded-md border text-xs p-1"
                                                                    value={editMetadata.dataType || 'text'}
                                                                    onChange={(e) => setEditMetadata({ ...editMetadata, dataType: e.target.value })}
                                                                >
                                                                    <option value="text">Tekst</option>
                                                                    <option value="number">Liczba</option>
                                                                    <option value="date">Data</option>
                                                                    <option value="currency">Waluta</option>
                                                                    <option value="email">Email</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px]">Dotyczy</Label>
                                                                <select
                                                                    className="w-full rounded-md border text-xs p-1"
                                                                    value={editMetadata.targetType || 'clients'}
                                                                    onChange={(e) => setEditMetadata({ ...editMetadata, targetType: e.target.value })}
                                                                >
                                                                    {dictionaryTypes.filter(t => t.value !== 'fields').map(t => (
                                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleUpdate(item._id)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-4 h-4 rounded-full"
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                        <span className="font-medium">{item.name}</span>
                                                    </div>
                                                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                                                        <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 ml-6">
                                                            {selectedType === 'fields' ? (
                                                                <>
                                                                    <div>Typ: {item.metadata?.dataType}</div>
                                                                    <div>Słownik: {dictionaryTypes.find(t => t.value === item.metadata?.targetType)?.label}</div>
                                                                </>
                                                            ) : (
                                                                Object.entries(item.metadata).map(([key, value]) => (
                                                                    <div key={key}>{key}: {String(value)}</div>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => startEditing(item)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(item._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
