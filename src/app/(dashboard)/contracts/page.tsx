'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Search, Eye, Download, X, Sparkles } from 'lucide-react';
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
        endDate?: string;
    };
    createdAt: string;
    aiSummary?: string;
    createdBy?: {
        name: string;
    };
}

function ContractsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get('status') || '';
    const expiringParam = searchParams.get('expiring') || '';

    // State for AI Summary modal
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchContracts();
    }, [page, search, initialStatus, expiringParam]);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(search && { search }),
                ...(initialStatus && { status: initialStatus }),
                ...(expiringParam && { expiring: expiringParam }),
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

    const isExpiringSoon = (dateStr?: string) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const today = new Date();
        const diff = date.getTime() - today.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 30;
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
                    <div className="grid gap-4 relative">
                        {contracts.map((contract) => (
                            <Card
                                key={contract._id}
                                className="transition-all hover:ring-1 hover:ring-primary/20"
                            >
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
                                        <div className="flex gap-2">
                                            {contract.aiSummary && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setSelectedContract(contract)}
                                                >
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Pokaż Podsumowanie AI
                                                </Button>
                                            )}
                                            <Link href={`/contracts/${contract._id}`}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Zobacz
                                                </Button>
                                            </Link>
                                        </div>
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
                                        <div>
                                            <span className="text-muted-foreground">Koniec: </span>
                                            <span className={isExpiringSoon(contract.metadata.endDate) ? 'text-red-500 font-bold underline decoration-red-500' : ''}>
                                                {contract.metadata.endDate ? formatDate(contract.metadata.endDate) : 'nie określona'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Modal for AI Summary */}
                        {selectedContract && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                                <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in duration-200">
                                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Sparkles className="h-5 w-5" />
                                            <CardTitle className="text-xl">Podsumowanie AI</CardTitle>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedContract(null)}>
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-y-auto pt-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Dotyczy umowy:</h4>
                                                <p className="font-medium text-lg">{selectedContract.title}</p>
                                            </div>
                                            <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                                <p className="text-base leading-relaxed whitespace-pre-wrap">
                                                    {selectedContract.aiSummary}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="p-4 border-t flex justify-end">
                                        <Button onClick={() => setSelectedContract(null)}>Zamknij</Button>
                                    </div>
                                </Card>
                            </div>
                        )}
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
