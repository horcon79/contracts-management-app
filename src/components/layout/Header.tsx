'use client';

import { ThemeToggle } from './ThemeToggle';
import { useSession } from 'next-auth/react';

export function Header() {
    const { data: session } = useSession();

    return (
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center gap-4">
                {/* Placeholder for breadcrumbs or page title if needed */}
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
            </div>
        </header>
    );
}
