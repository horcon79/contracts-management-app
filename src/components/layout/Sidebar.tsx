'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Home,
    Search,
    Upload,
    Settings,
    Users,
    Shield,
    BookOpen,
    LogOut,
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Umowy', href: '/contracts', icon: FileText },
    { name: 'Wyszukaj', href: '/search', icon: Search },
    { name: 'Dodaj umowę', href: '/contracts/upload', icon: Upload },
    { name: 'Słowniki', href: '/dictionaries', icon: BookOpen },
];

const adminNavigation = [
    { name: 'Użytkownicy', href: '/admin/users', icon: Users },
    { name: 'Ustawienia', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'admin';

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card">
            <div className="flex h-16 items-center gap-2 border-b px-6">
                <FileText className="h-6 w-6 text-primary" />
                <span className="font-semibold">Umowy</span>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}

                {isAdmin && (
                    <>
                        <div className="my-4 border-t" />
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Administracja
                        </p>
                        {adminNavigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            <div className="border-t p-4">
                <div className="mb-2 px-3">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    <LogOut className="h-4 w-4" />
                    Wyloguj się
                </Button>

                <div className="mt-4 px-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Wersja</p>
                    <p className="text-xs font-mono text-muted-foreground">v1.0.9</p>
                </div>
            </div>
        </div>
    );
}
