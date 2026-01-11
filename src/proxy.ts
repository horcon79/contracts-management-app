import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const isLoginPage = nextUrl.pathname === '/login';
    const isApiRoute = nextUrl.pathname.startsWith('/api');
    const isPublicRoute = nextUrl.pathname === '/';

    // Allow API routes to handle their own auth
    if (isApiRoute) {
        return NextResponse.next();
    }

    // Redirect to dashboard if logged in and trying to access login page
    if (isLoginPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }

    // Redirect to login if not logged in and trying to access protected routes
    if (!isLoggedIn && !isLoginPage && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', nextUrl));
    }

    // Check admin routes
    if (nextUrl.pathname.startsWith('/admin')) {
        const userRole = req.auth?.user?.role;
        if (userRole !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
