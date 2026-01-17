import NextAuth, { NextAuthConfig } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './mongodb';
import User from '@/models/User';
import { AzureSyncService } from './azure-sync';

export const authConfig: NextAuthConfig = {
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID || '',
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
            tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
            authorization: {
                params: {
                    scope: 'openid email profile User.Read offline_access',
                },
            },
        }),
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                await connectToDatabase();

                const user = await User.findOne({
                    email: credentials.email,
                    isActive: true,
                }).select('+password');

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (account && user) {
                // Logowanie przez Azure AD
                if (account.provider === 'azure-ad') {
                    token.accessToken = account.access_token;
                    token.refreshToken = account.refresh_token;
                    token.provider = account.provider;

                    // Synchronizuj użytkownika z Azure AD
                    try {
                        const profile = await AzureSyncService.getUserProfile(
                            account.access_token!
                        );
                        const syncedUser = await AzureSyncService.syncAzureUser(profile);

                        // Aktualizuj tokeny
                        await AzureSyncService.updateUserTokens(
                            profile.id,
                            account.access_token!,
                            account.refresh_token
                        );

                        token.id = syncedUser._id.toString();
                        token.role = syncedUser.role;
                    } catch (error) {
                        console.error('Azure AD sync error:', error);
                        token.id = user.id;
                    }
                } else {
                    // Logowanie przez credentials
                    token.id = user.id;
                    token.role = (user as any).role;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
        async signIn({ user, account }) {
            // Allow sign in
            return true;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    events: {
        async createUser({ user }) {
            // Opcjonalnie: wyślij email powitalny
        },
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
