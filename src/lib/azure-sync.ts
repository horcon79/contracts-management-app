import User, { IUser } from '@/models/User';
import { connectToDatabase } from './mongodb';

export interface AzureUserProfile {
    id: string;
    mail: string;
    displayName: string;
    userPrincipalName: string;
    jobTitle?: string;
    department?: string;
    memberOf?: Array<{ id: string; displayName: string }>;
}

export class AzureSyncService {
    /**
     * Pobiera szczegółowy profil użytkownika z Microsoft Graph API
     * oraz listę grup, do których należy
     */
    static async getUserProfile(accessToken: string): Promise<AzureUserProfile> {
        // Pobierz podstawowy profil
        const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to fetch Azure AD user profile');
        }

        const profile = await profileResponse.json();

        // Pobierz grupy użytkownika (opcjonalnie)
        let memberOf: Array<{ id: string; displayName: string }> = [];
        try {
            const groupsResponse = await fetch(
                'https://graph.microsoft.com/v1.0/me/memberOf?$select=id,displayName',
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (groupsResponse.ok) {
                const groupsData = await groupsResponse.json();
                memberOf = groupsData.value?.map((g: any) => ({
                    id: g.id,
                    displayName: g.displayName,
                })) || [];
            }
        } catch (error) {
            console.warn('Failed to fetch user groups:', error);
        }

        return {
            id: profile.id,
            mail: profile.mail || profile.userPrincipalName,
            displayName: profile.displayName,
            userPrincipalName: profile.userPrincipalName,
            jobTitle: profile.jobTitle,
            department: profile.department,
            memberOf,
        };
    }

    /**
     * Synchronizuje użytkownika z Azure AD (automatyczna przy logowaniu)
     */
    static async syncAzureUser(profile: AzureUserProfile): Promise<IUser> {
        await connectToDatabase();

        let user = await User.findOne({ azureAdId: profile.id });

        if (!user) {
            // Sprawdź czy użytkownik istnieje po email
            user = await User.findOne({ email: profile.mail.toLowerCase() });

            if (user) {
                // Połącz istniejące konto z Azure AD
                user.azureAdId = profile.id;
                user.adUsername = profile.userPrincipalName;
                user.lastAzureSync = new Date();
                await user.save();
            } else {
                // Utwórz nowego użytkownika
                user = await User.create({
                    email: profile.mail.toLowerCase(),
                    name: profile.displayName,
                    role: 'read',
                    azureAdId: profile.id,
                    adUsername: profile.userPrincipalName,
                    isActive: true,
                    lastAzureSync: new Date(),
                });
            }
        } else {
            // Aktualizuj dane użytkownika
            user.name = profile.displayName;
            user.lastAzureSync = new Date();
            await user.save();
        }

        return user;
    }

    /**
     * Synchronizuje wszystkich użytkowników z grupy Azure AD (ręczna przez admina)
     */
    static async syncGroupMembers(
        accessToken: string,
        groupId: string
    ): Promise<{ synced: number; errors: number; members: Array<{ id: string; email: string; name: string }> }> {
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,displayName,mail,userPrincipalName`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch group members: ${response.statusText}`);
        }

        const data = await response.json();
        let synced = 0;
        let errors = 0;
        const members: Array<{ id: string; email: string; name: string }> = [];

        for (const member of data.value || []) {
            try {
                if (member['@odata.type'] === '#microsoft.graph.user') {
                    const userProfile: AzureUserProfile = {
                        id: member.id,
                        mail: member.mail || member.userPrincipalName,
                        displayName: member.displayName,
                        userPrincipalName: member.userPrincipalName,
                    };

                    await this.syncAzureUser(userProfile);
                    synced++;
                    members.push({
                        id: member.id,
                        email: member.mail || member.userPrincipalName,
                        name: member.displayName,
                    });
                }
            } catch (error) {
                console.error(`Failed to sync user ${member.id}:`, error);
                errors++;
            }
        }

        return { synced, errors, members };
    }

    /**
     * Pobiera listę grup Azure AD dla użytkownika
     */
    static async getUserGroups(accessToken: string): Promise<Array<{ id: string; name: string }>> {
        try {
            const response = await fetch(
                'https://graph.microsoft.com/v1.0/me/memberOf?$select=id,displayName',
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            return data.value?.map((g: any) => ({
                id: g.id,
                name: g.displayName,
            })) || [];
        } catch {
            return [];
        }
    }

    /**
     * Aktualizuje tokeny użytkownika po logowaniu
     */
    static async updateUserTokens(
        azureAdId: string,
        accessToken: string,
        refreshToken?: string
    ): Promise<void> {
        await connectToDatabase();

        const update: Record<string, unknown> = {
            azureAdToken: accessToken,
            lastAzureSync: new Date(),
        };

        if (refreshToken) {
            update.azureAdRefreshToken = refreshToken;
        }

        await User.findOneAndUpdate({ azureAdId }, update);
    }

    /**
     * Wyszukuje użytkowników w Azure AD (dla administracji)
     */
    static async searchAzureUsers(
        accessToken: string,
        searchTerm: string
    ): Promise<Array<{ id: string; email: string; name: string }>> {
        try {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/users?$filter=startswith(displayName,'${encodeURIComponent(searchTerm)}') or startswith(mail,'${encodeURIComponent(searchTerm)}')&$select=id,displayName,mail,userPrincipalName&$top=20`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            return data.value?.map((u: any) => ({
                id: u.id,
                email: u.mail || u.userPrincipalName,
                name: u.displayName,
            })) || [];
        } catch {
            return [];
        }
    }
}
