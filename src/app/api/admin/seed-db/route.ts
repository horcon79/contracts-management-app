import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Dictionary from '@/models/Dictionary';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        await connectToDatabase();

        // 1. Ensure admin user has a password
        const adminEmail = 'admin@example.com';
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const updatedUser = await User.findOneAndUpdate(
            { email: adminEmail },
            {
                $set: {
                    password: hashedPassword,
                    role: 'admin',
                    isActive: true,
                    name: 'Administrator'
                }
            },
            { upsert: true, new: true }
        );

        // 2. Seed basic dictionaries if empty
        const count = await Dictionary.countDocuments();
        if (count === 0) {
            const defaultDictionaries = [
                { type: 'statuses', name: 'Aktywna', color: '#22C55E', isActive: true, order: 0 },
                { type: 'statuses', name: 'Wygasła', color: '#EF4444', isActive: true, order: 0 },
                { type: 'statuses', name: 'W przygotowaniu', color: '#F59E0B', isActive: true, order: 0 },
                { type: 'types', name: 'Umowa o pracę', color: '#3B82F6', isActive: true, order: 0 },
                { type: 'types', name: 'Umowa zlecenie', color: '#8B5CF6', isActive: true, order: 0 },
                { type: 'clients', name: 'Klient Testowy', color: '#3B82F6', isActive: true, order: 0 },
                { type: 'categories', name: 'IT', color: '#6366F1', isActive: true, order: 0 },
                { type: 'persons', name: 'Jan Kowalski', color: '#6366F1', isActive: true, order: 0 },
                { type: 'fields', name: 'NIP', color: '#6B7280', isActive: true, order: 1, metadata: { targetType: 'clients', dataType: 'text' } },
                { type: 'fields', name: 'Adres', color: '#6B7280', isActive: true, order: 2, metadata: { targetType: 'clients', dataType: 'text' } },
                { type: 'fields', name: 'Telefon', color: '#6B7280', isActive: true, order: 3, metadata: { targetType: 'clients', dataType: 'text' } },
                { type: 'fields', name: 'Osoba kontaktowa', color: '#6B7280', isActive: true, order: 4, metadata: { targetType: 'clients', dataType: 'text' } },
            ];
            await Dictionary.insertMany(defaultDictionaries);
        }

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully',
            admin: {
                email: adminEmail,
                password: 'admin123 (changed)'
            }
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
    }
}
