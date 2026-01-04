'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Search, Eye, Download, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Contract {
    _id: string;
    title: string;
    contractNumber?: string;
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

function ContractsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get('status') || '';

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchContracts();
    }, [page, search, initialStatus]);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(search && { search }),
                ...(initialStatus && { status: initialStatus }),
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

            {initialStatus && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Aktywny filtr:</span>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => router.push('/contracts')}
                    >
                        Status: {initialStatus}
                        <X className="ml-1 h-3 w-3" />
                    </Button>
                </div>
            )}

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
                                            {contract.contractNumber && (
                                                <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mb-1">
                                                    {contract.contractNumber}
                                                </p>
                                            )}
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

export default function ContractsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <ContractsContent />
        </Suspense>
    );
}
