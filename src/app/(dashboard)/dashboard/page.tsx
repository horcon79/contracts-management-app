import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
    const session = await auth();

    const stats = [
        { name: 'Wszystkie umowy', value: '0', icon: FileText, href: '/contracts' },
        { name: 'Aktywne umowy', value: '0', icon: TrendingUp, href: '/contracts?status=active' },
        { name: 'Wygasające (30 dni)', value: '0', icon: Clock, href: '/contracts?expiring=30' },
        { name: 'Klienci', value: '0', icon: Users, href: '/dictionaries?type=clients' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Witaj, {session?.user?.name}!</h1>
                    <p className="text-muted-foreground">
                        Przegląd systemu zarządzania umowami
                    </p>
                </div>
                <Link href="/contracts/upload">
                    <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        Dodaj nową umowę
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Link key={stat.name} href={stat.href}>
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ostatnio dodane umowy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Brak umów do wyświetlenia. Dodaj pierwszą umowę!
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Szybkie wyszukiwanie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Wyszukaj umowy w języku naturalnym używając AI.
                        </p>
                        <Link href="/search">
                            <Button variant="outline" className="w-full">
                                Przejdź do wyszukiwarki
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
