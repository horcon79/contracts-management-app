import Notification, { INotification, NotificationType } from '@/models/Notification';
import { EmailService } from './mail';
import User from '@/models/User';
import Contract from '@/models/Contract';
import Team from '@/models/Team';
import mongoose from 'mongoose';

interface NotificationPayload {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityType: string;
    relatedEntityId: string;
    contractId?: string;
    metadata?: Record<string, unknown>;
}

export class NotificationService {
    /**
     * Tworzy powiadomienie i wysyła email
     */
    static async createNotification(payload: NotificationPayload): Promise<INotification> {
        const notification = await Notification.create({
            userId: new mongoose.Types.ObjectId(payload.userId),
            type: payload.type,
            title: payload.title,
            message: payload.message,
            relatedEntityType: payload.relatedEntityType,
            relatedEntityId: new mongoose.Types.ObjectId(payload.relatedEntityId),
            contractId: payload.contractId
                ? new mongoose.Types.ObjectId(payload.contractId)
                : undefined,
            metadata: payload.metadata,
            isRead: false,
            isEmailSent: false,
        });

        // Wyślij email powiadomienia (asynchronicznie, nie blokuj)
        this.sendEmailNotification(notification).catch(err =>
            console.error('Failed to send email notification:', err)
        );

        return notification;
    }

    /**
     * Wysyła powiadomienie email do użytkownika
     */
    private static async sendEmailNotification(notification: INotification): Promise<void> {
        try {
            const user = await User.findById(notification.userId);
            if (!user || !user.isActive) return;

            const html = this.generateEmailTemplate(notification);

            await EmailService.sendMail({
                to: user.email,
                subject: `[Zarządzanie Umowami] ${notification.title}`,
                html,
            });

            // Oznacz jako wysłane
            notification.isEmailSent = true;
            notification.emailSentAt = new Date();
            await notification.save();
        } catch (error) {
            console.error('Failed to send email notification:', error);
            notification.emailError = error instanceof Error ? error.message : 'Unknown error';
            await notification.save();
        }
    }

    /**
     * Generuje szablon email dla powiadomienia
     */
    private static generateEmailTemplate(notification: INotification): string {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const contractUrl = notification.contractId
            ? `${baseUrl}/contracts/${notification.contractId}`
            : '#';

        const templates: Record<NotificationType, (n: INotification, url: string) => string> = {
            assignment_received: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #1e40af; margin-top: 0;">📋 Nowe przydzielenie umowy</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                            <strong>${n.title}</strong>
                        </div>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz umowę
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            assignment_changed: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #1e40af; margin-top: 0;">🔄 Zmiana przypisania umowy</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz szczegóły
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            assignment_to_team: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #1e40af; margin-top: 0;">👥 Przydzielenie do zespołu</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz umowę
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            comment_added: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #059669; margin-top: 0;">💬 Nowy komentarz</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz komentarz
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            comment_mention: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #7c3aed; margin-top: 0;">@ Wzmianka</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz wzmiankę
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            signature_required: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #dc2626; margin-top: 0;">⚠️ Wymagany podpis kwalifikowany</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                            <strong>Ważne:</strong> Umowa wymaga Twojego podpisu kwalifikowanego.
                        </div>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Podpisz umowę
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            signature_completed: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #059669; margin-top: 0;">✅ Podpis kwalifikowany złożony</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz szczegóły podpisu
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            status_changed: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #1e40af; margin-top: 0;">📊 Zmiana statusu umowy</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz umowę
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            contract_shared: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #1e40af; margin-top: 0;">📤 Udostępniono umowę</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz umowę
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            team_invitation: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #7c3aed; margin-top: 0;">👋 Zaproszenie do zespołu</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz zaproszenie
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            due_date_reminder: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #dc2626; margin-top: 0;">⏰ Przypomnienie o terminie</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz umowę
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
            signature_expired: (n, url) => `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background: white; border-radius: 8px; padding: 24px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #dc2626; margin-top: 0;">⚠️ Podpis wygasł</h2>
                        <p>Witaj,</p>
                        <p>${n.message}</p>
                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                            Zobacz szczegóły
                        </a>
                    </div>
                    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
                        To jest automatyczna wiadomość z systemu Zarządzanie Umowami.
                    </p>
                </div>
            `,
        };

        const templateFn = templates[notification.type] || templates.assignment_received;
        return templateFn(notification, contractUrl);
    }

    /**
     * Tworzy powiadomienie o przydzieleniu do zespołu
     */
    static async createTeamAssignmentNotification(
        contract: typeof Contract.prototype,
        team: typeof Team.prototype,
        assignedBy: string
    ): Promise<void> {
        const members = team.members.filter(m => m.userId.toString() !== assignedBy);

        await Promise.all(
            members.map(member =>
                this.createNotification({
                    userId: member.userId.toString(),
                    type: 'assignment_to_team',
                    title: 'Przydzielenie umowy do zespołu',
                    message: `Umowa "${contract.title}" została przydzielona do zespołu "${team.name}".`,
                    relatedEntityType: 'contract',
                    relatedEntityId: contract._id.toString(),
                    contractId: contract._id.toString(),
                    metadata: {
                        teamId: team._id.toString(),
                        teamName: team.name,
                        assignedBy,
                    },
                })
            )
        );
    }

    /**
     * Tworzy powiadomienie o wymaganym podpisie
     */
    static async createSignatureRequiredNotification(
        contract: typeof Contract.prototype,
        signerEmail: string,
        signerName: string
    ): Promise<void> {
        const user = await User.findOne({ email: signerEmail });
        if (!user) return;

        await this.createNotification({
            userId: user._id.toString(),
            type: 'signature_required',
            title: 'Wymagany podpis kwalifikowany',
            message: `Umowa "${contract.title}" wymaga Twojego podpisu kwalifikowanego.`,
            relatedEntityType: 'contract',
            relatedEntityId: contract._id.toString(),
            contractId: contract._id.toString(),
            metadata: {
                contractTitle: contract.title,
                deadline: contract.signatureDeadline,
            },
        });
    }

    /**
     * Pobiera liczbę nieprzeczytanych powiadomień
     */
    static async getUnreadCount(userId: string): Promise<number> {
        await connectToDatabase();
        return Notification.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            isRead: false,
        });
    }
}
