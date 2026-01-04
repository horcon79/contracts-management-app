'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Trash2, Edit2, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface User {
    _id: string;
    email: string;
    name: string;
    role: 'read' | 'edit' | 'admin';
    isActive: boolean;
}

export default function UsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState<{
        email: string;
        name: string;
        password: string;
        role: 'read' | 'edit' | 'admin';
    }>({
        email: '',
        name: '',
        password: '',
        role: 'read',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingUser ? `/api/admin/users/${editingUser._id}` : '/api/admin/users';
            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsAdding(false);
                setEditingUser(null);
                setFormData({ email: '', name: '', password: '', role: 'read' });
                fetchUsers();
            } else {
                const data = await response.json();
                alert(data.error || 'Wystąpił błąd');
            }
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
        try {
            const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (response.ok) fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Ładowanie...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Zarządzanie użytkownikami</h1>
                    <p className="text-muted-foreground">Dodawaj i edytuj użytkowników systemu oraz ich uprawnienia</p>
                </div>
                <Button onClick={() => {
                    setIsAdding(true);
                    setEditingUser(null);
                    setFormData({ email: '', name: '', password: '', role: 'read' });
                }}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Dodaj użytkownika
                </Button>
            </div>

            {(isAdding || editingUser) && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingUser ? 'Edytuj użytkownika' : 'Nowy użytkownik'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="name">Imię i nazwisko</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">{editingUser ? 'Hasło (zostaw puste by nie zmieniać)' : 'Hasło'}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Rola</Label>
                                <select
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="read">Odczyt</option>
                                    <option value="edit">Edycja</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">{editingUser ? 'Zapisz' : 'Dodaj'}</Button>
                                <Button type="button" variant="outline" onClick={() => {
                                    setIsAdding(false);
                                    setEditingUser(null);
                                }}>Anuluj</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                    <Card key={user._id}>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-primary/10">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        setEditingUser(user);
                                        setFormData({
                                            name: user.name,
                                            email: user.email,
                                            password: '',
                                            role: user.role,
                                        });
                                    }}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(user._id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {user.role === 'admin' && <ShieldAlert className="h-4 w-4 text-red-500" />}
                                    {user.role === 'edit' && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                                    {user.role === 'read' && <Shield className="h-4 w-4 text-green-500" />}
                                    <span className="text-sm font-medium capitalize">
                                        {user.role === 'admin' ? 'Administrator' : user.role === 'edit' ? 'Edycja' : 'Odczyt'}
                                    </span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
