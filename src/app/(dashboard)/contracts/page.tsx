'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Search, Eye, Download, X, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Loader2, Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface Contract {
    _id: string;
    title: string;
    contractNumber?: string;
    originalFileName: string;
    metadata: {
        company?: string;
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

    // Filter states
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<Record<string, string>>({
        company: '',
        client: '',
        status: '',
        category: '',
        responsiblePerson: '',
        contractType: '',
        startDate: '',
        endDate: '',
    });

    const [dictionaries, setDictionaries] = useState<{
        clients: any[];
        types: any[];
        statuses: any[];
        persons: any[];
        categories: any[];
        companies: any[];
        fields: any[];
    }>({
        clients: [],
        types: [],
        statuses: [],
        persons: [],
        categories: [],
        companies: [],
        fields: []
    });

    useEffect(() => {
        fetchDictionaries();
    }, []);

    const fetchDictionaries = async () => {
        try {
            const types = ['clients', 'types', 'statuses', 'persons', 'categories', 'companies', 'fields'];
            const results = await Promise.all(
                types.map(type => fetch(`/api/dictionaries?type=${type}`).then(res => res.json()))
            );
            setDictionaries({
                clients: results[0],
                types: results[1],
                statuses: results[2],
                persons: results[3],
                categories: results[4],
                companies: results[5],
                fields: results[6]
            });
        } catch (error) {
            console.error('Error fetching dictionaries:', error);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [page, search, initialStatus, expiringParam, filters]);

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

            // Add advanced filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') {
                    params.append(key, value);
                }
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

            <Card className="border-muted/40 shadow-sm bg-muted/5">
                <CardContent className="p-4 space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Szukaj umów..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10"
                            />
                        </div>
                        <Button type="submit" className="h-10 px-6">Szukaj</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                            className={`h-10 ${isFiltersOpen ? 'bg-accent' : ''}`}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </form>

                    {isFiltersOpen && (
                        <div className="grid gap-4 pt-4 border-t border-muted/20 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Nasza Firma</label>
                                    <select
                                        value={filters.company}
                                        onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Wszystkie firmy</option>
                                        {dictionaries.companies.map((c) => (
                                            <option key={c._id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Klient</label>
                                    <select
                                        value={filters.client}
                                        onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Wszyscy klienci</option>
                                        {dictionaries.clients.map((c) => (
                                            <option key={c._id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Wszystkie statusy</option>
                                        {dictionaries.statuses.map((s) => (
                                            <option key={s._id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Kategoria</label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Wszystkie kategorie</option>
                                        {dictionaries.categories.map((c) => (
                                            <option key={c._id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Osoba odpowiedzialna</label>
                                    <select
                                        value={filters.responsiblePerson}
                                        onChange={(e) => setFilters({ ...filters, responsiblePerson: e.target.value })}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Wszystkie osoby</option>
                                        {dictionaries.persons.map((p) => (
                                            <option key={p._id} value={p.name}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Typ umowy</label>
                                    <select
                                        value={filters.contractType}
                                        onChange={(e) => setFilters({ ...filters, contractType: e.target.value })}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Wszystkie typy</option>
                                        {dictionaries.types.map((t) => (
                                            <option key={t._id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Data końca (od)</label>
                                    <Input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="h-9"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Data końca (do)</label>
                                    <Input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        className="h-9"
                                    />
                                </div>

                                {dictionaries.fields
                                    .filter(f => !f.metadata?.targetType || f.metadata?.targetType === 'clients')
                                    .map((field) => (
                                        <div key={field._id} className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">{field.name}</label>
                                            <Input
                                                placeholder={`Szukaj ${field.name.toLowerCase()}...`}
                                                value={filters[`metadata.${field.name}`] || ''}
                                                onChange={(e) => setFilters({ ...filters, [`metadata.${field.name}`]: e.target.value })}
                                                className="h-9"
                                            />
                                        </div>
                                    ))}
                            </div>

                            <div className="flex justify-end pt-2 border-t border-muted/20">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setFilters({
                                            company: '',
                                            client: '',
                                            status: '',
                                            category: '',
                                            responsiblePerson: '',
                                            contractType: '',
                                            startDate: '',
                                            endDate: '',
                                        });
                                        setSearch('');
                                        setPage(1);
                                    }}
                                    className="text-xs"
                                >
                                    <RotateCcw className="mr-2 h-3 w-3" />
                                    Wyczyść filtry
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {
                loading ? (
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
                                            {contract.metadata.company && (
                                                <div>
                                                    <span className="text-muted-foreground">Firma: </span>
                                                    <span className="font-semibold">{contract.metadata.company}</span>
                                                </div>
                                            )}
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
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                    <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in duration-200 bg-white dark:bg-zinc-950">
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
                                                    <p className="font-medium text-lg">{selectedContract?.title}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-muted border border-border">
                                                    <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">
                                                        {selectedContract?.aiSummary}
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
