'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Sparkles, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SearchResult {
    _id: string;
    title: string;
    originalFileName: string;
    metadata: {
        client?: string;
        status?: string;
    };
    createdAt: string;
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const response = await fetch(`/api/contracts?search=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setResults(data.contracts);
            }
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Wyszukiwarka umów</h1>
                <p className="text-muted-foreground">
                    Wyszukuj umowy używając języka naturalnego
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="relative">
                            <Sparkles className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                            <Input
                                placeholder="Np. umowy z klientem ABC z ostatnich 6 miesięcy..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-12 h-12 text-lg"
                            />
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={loading || !query.trim()}>
                            <Search className="mr-2 h-5 w-5" />
                            {loading ? 'Szukam...' : 'Szukaj'}
                        </Button>
                    </form>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground">Przykłady:</span>
                        {[
                            'umowy na dostawy',
                            'klient XYZ',
                            'wygasające w tym miesiącu',
                            'wartość powyżej 100000',
                        ].map((example) => (
                            <button
                                key={example}
                                onClick={() => setQuery(example)}
                                className="text-sm text-primary hover:underline"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {searched && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">
                        Wyniki wyszukiwania ({results.length})
                    </h2>

                    {loading ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">Przeszukuję umowy...</p>
                            </CardContent>
                        </Card>
                    ) : results.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    Nie znaleziono umów pasujących do zapytania
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {results.map((result) => (
                                <Card key={result._id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{result.title}</CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    {result.originalFileName}
                                                </p>
                                            </div>
                                            <Link href={`/contracts/${result._id}`}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Zobacz
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            {result.metadata.client && (
                                                <div>
                                                    <span className="text-muted-foreground">Klient: </span>
                                                    {result.metadata.client}
                                                </div>
                                            )}
                                            {result.metadata.status && (
                                                <div>
                                                    <span className="text-muted-foreground">Status: </span>
                                                    {result.metadata.status}
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-muted-foreground">Dodano: </span>
                                                {formatDate(result.createdAt)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
