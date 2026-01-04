import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { connectToDatabase } from '@/lib/mongodb';
import Contract from '@/models/Contract';
import Dictionary from '@/models/Dictionary';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export default async function DashboardPage() {
    const session = await auth();
    await connectToDatabase();

    const [totalContracts, activeContracts, expiringContracts, totalClients, recentContracts] = await Promise.all([
        Contract.countDocuments(),
        Contract.countDocuments({ 'metadata.status': 'Aktywna' }),
        Contract.countDocuments({
            'metadata.endDate': {
                $gte: new Date(),
                $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        }),
        Dictionary.countDocuments({ type: 'clients', isActive: true }),
        Contract.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('createdBy', 'name')
            .lean()
    ]);

    const stats = [
        { name: 'Wszystkie umowy', value: totalContracts.toString(), icon: FileText, href: '/contracts' },
        { name: 'Aktywne umowy', value: activeContracts.toString(), icon: TrendingUp, href: '/contracts?status=Aktywna' },
        { name: 'Wygasające (30 dni)', value: expiringContracts.toString(), icon: Clock, href: '/contracts?expiring=30' },
        { name: 'Klienci', value: totalClients.toString(), icon: Users, href: '/dictionaries?type=clients' },
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
                        {recentContracts.length > 0 ? (
                            <div className="space-y-4">
                                {recentContracts.map((contract: any) => (
                                    <Link key={contract._id.toString()} href={`/contracts/${contract._id}`}>
                                        <div className="flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer border-b last:border-0">
                                            <div>
                                                <p className="font-medium">{contract.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Klient: {contract.metadata?.client || 'Brak'} | Dodano: {format(new Date(contract.createdAt), 'dd.MM.yyyy', { locale: pl })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${contract.metadata?.status === 'Aktywna' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {contract.metadata?.status || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                <Link href="/contracts">
                                    <Button variant="ghost" size="sm" className="w-full mt-2 text-primary">
                                        Pokaż wszystkie umowy
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Brak umów do wyświetlenia. Dodaj pierwszą umowę!
                            </p>
                        )}
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
