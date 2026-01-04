import nodemailer from 'nodemailer';
import Settings from '@/models/Settings';
import { connectToDatabase } from './mongodb';

export class EmailService {
    private static async getTransporter() {
        await connectToDatabase();
        const settingsList = await Settings.find({
            key: { $in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_secure'] }
        });

        const config = settingsList.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        if (!config.smtp_host) {
            throw new Error('SMTP host not configured');
        }

        return nodemailer.createTransport({
            host: config.smtp_host,
            port: parseInt(config.smtp_port) || 587,
            secure: config.smtp_secure === 'true',
            auth: {
                user: config.smtp_user,
                pass: config.smtp_pass,
            },
        });
    }

    private static async getFromEmail() {
        const settings = await Settings.findOne({ key: 'smtp_from' });
        return settings?.value || 'no-reply@contract-manager.local';
    }

    static async sendMail({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string }) {
        const transporter = await this.getTransporter();
        const from = await this.getFromEmail();

        return transporter.sendMail({
            from: `"Zarządzanie Umowami" <${from}>`,
            to,
            subject,
            text,
            html,
        });
    }

    static async testConnection(config: any) {
        const transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: parseInt(config.smtp_port) || 587,
            secure: config.smtp_secure === 'true',
            auth: {
                user: config.smtp_user,
                pass: config.smtp_pass,
            },
        });

        await transporter.verify();

        return transporter.sendMail({
            from: `"Zarządzanie Umowami" <${config.smtp_from}>`,
            to: config.smtp_user,
            subject: 'Test połączenia SMTP - Zarządzanie Umowami',
            text: 'To jest wiadomość testowa z Twojej aplikacji do zarządzania umowami. Jeżeli ją widzisz, konfiguracja SMTP jest poprawna.',
            html: '<h1>Test połączenia SMTP</h1><p>To jest wiadomość testowa z Twojej aplikacji do zarządzania umowami. Jeżeli ją widzisz, konfiguracja SMTP jest poprawna.</p>',
        });
    }
}
