'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

type DictionaryType = 'clients' | 'types' | 'statuses' | 'persons' | 'categories' | 'fields';

interface DictionaryItem {
    _id: string;
    type: DictionaryType;
    name: string;
    color: string;
    isActive: boolean;
    metadata?: Record<string, string>;
}

const dictionaryTypes: { value: DictionaryType; label: string }[] = [
    { value: 'clients', label: 'Klienci' },
    { value: 'types', label: 'Typy umów' },
    { value: 'statuses', label: 'Statusy' },
    { value: 'persons', label: 'Osoby odpowiedzialne' },
    { value: 'categories', label: 'Kategorie' },
    { value: 'fields', label: 'Dodatkowe pola' },
];

export default function DictionariesPage() {
    const [selectedType, setSelectedType] = useState<DictionaryType>('clients');
    const [items, setItems] = useState<DictionaryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#6B7280');
    const [newMetadata, setNewMetadata] = useState<Record<string, string>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editMetadata, setEditMetadata] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchItems();
    }, [selectedType]);

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
                fetchItems();
                alert('Pomyślnie dodano element');
            } else {
                const errorData = await response.json();
                alert(`Błąd: ${errorData.error || 'Nie udało się dodać elementu'}`);
            }
        } catch (error) {
            console.error('Error adding dictionary item:', error);
            alert('Wystąpił nieoczekiwany błąd');
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
            }
        } catch (error) {
            console.error('Error updating dictionary item:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Czy na pewno chcesz usunąć ten element?')) return;

        try {
            const response = await fetch(`/api/dictionaries/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchItems();
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

                        {selectedType === 'clients' && (
                            <div className="space-y-4 pt-2 border-t">
                                <p className="text-sm font-medium">Dane klienta (opcjonalne)</p>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Adres</Label>
                                    <Input
                                        id="address"
                                        value={newMetadata.address || ''}
                                        onChange={(e) => setNewMetadata({ ...newMetadata, address: e.target.value })}
                                        placeholder="ul. Testowa 1, 00-000 Miasto"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="nip">NIP</Label>
                                        <Input
                                            id="nip"
                                            value={newMetadata.nip || ''}
                                            onChange={(e) => setNewMetadata({ ...newMetadata, nip: e.target.value })}
                                            placeholder="000-000-00-00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Telefon</Label>
                                        <Input
                                            id="phone"
                                            value={newMetadata.phone || ''}
                                            onChange={(e) => setNewMetadata({ ...newMetadata, phone: e.target.value })}
                                            placeholder="+48 000 000 000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactPerson">Osoba kontaktowa</Label>
                                    <Input
                                        id="contactPerson"
                                        value={newMetadata.contactPerson || ''}
                                        onChange={(e) => setNewMetadata({ ...newMetadata, contactPerson: e.target.value })}
                                        placeholder="Imię i nazwisko"
                                    />
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
                                                            {item.metadata.nip && <div>NIP: {item.metadata.nip}</div>}
                                                            {item.metadata.phone && <div>Tel: {item.metadata.phone}</div>}
                                                            {item.metadata.address && <div className="col-span-2">Adres: {item.metadata.address}</div>}
                                                            {item.metadata.contactPerson && <div className="col-span-2">Kontakt: {item.metadata.contactPerson}</div>}
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
