'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Search, Eye, Download } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Contract {
    _id: string;
    title: string;
    originalFileName: string;
    metadata: {
        client?: string;
        status?: string;
        contractDate?: string;
    };
    createdAt: string;
    createdBy?: {
        name: string;
    };
}

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchContracts();
    }, [page, search]);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(search && { search }),
            });

            const response = await fetch(`/api/contracts?${params}`);
            if (response.ok) {
                const data = await response.json();
                setContracts(data.contracts);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchContracts();
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            ...(search && { search }),
        });
        window.location.href = `/api/contracts/export?${params.toString()}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Umowy</h1>
                    <p className="text-muted-foreground">Lista wszystkich umów w systemie</p>
                </div>
                <Link href="/contracts/upload">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Dodaj umowę
                    </Button>
                </Link>
                <Button variant="outline" onClick={handleExport} className="ml-2">
                    <Download className="mr-2 h-4 w-4" />
                    Eksportuj CSV
                </Button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Szukaj umów..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button type="submit">Szukaj</Button>
            </form>

            {loading ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Ładowanie...</p>
                </div>
            ) : contracts.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Brak umów do wyświetlenia</p>
                        <Link href="/contracts/upload">
                            <Button className="mt-4">
                                <Plus className="mr-2 h-4 w-4" />
                                Dodaj pierwszą umowę
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4">
                        {contracts.map((contract) => (
                            <Card key={contract._id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{contract.title}</CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {contract.originalFileName}
                                            </p>
                                        </div>
                                        <Link href={`/contracts/${contract._id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="mr-2 h-4 w-4" />
                                                Zobacz
                                            </Button>
                                        </Link>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        {contract.metadata.client && (
                                            <div>
                                                <span className="text-muted-foreground">Klient: </span>
                                                {contract.metadata.client}
                                            </div>
                                        )}
                                        {contract.metadata.status && (
                                            <div>
                                                <span className="text-muted-foreground">Status: </span>
                                                {contract.metadata.status}
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-muted-foreground">Dodano: </span>
                                            {formatDate(contract.createdAt)}
                                        </div>
                                        {contract.createdBy && (
                                            <div>
                                                <span className="text-muted-foreground">Przez: </span>
                                                {contract.createdBy.name}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Poprzednia
                            </Button>
                            <span className="flex items-center px-4">
                                Strona {page} z {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Następna
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
