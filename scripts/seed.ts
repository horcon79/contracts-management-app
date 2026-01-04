import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contracts_app';

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }

        // Create admin user
        const usersCollection = db.collection('users');

        const existingAdmin = await usersCollection.findOne({ email: 'admin@example.com' });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await usersCollection.insertOne({
                email: 'admin@example.com',
                name: 'Administrator',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log('Admin user created: admin@example.com / admin123');
        } else {
            console.log('Admin user already exists');
        }

        // Create default dictionaries
        const dictionariesCollection = db.collection('dictionaries');

        const defaultDictionaries = [
            { type: 'statuses', name: 'Aktywna', color: '#22C55E' },
            { type: 'statuses', name: 'Wygasła', color: '#EF4444' },
            { type: 'statuses', name: 'W przygotowaniu', color: '#F59E0B' },
            { type: 'statuses', name: 'Anulowana', color: '#6B7280' },
            { type: 'types', name: 'Umowa o pracę', color: '#3B82F6' },
            { type: 'types', name: 'Umowa zlecenie', color: '#8B5CF6' },
            { type: 'types', name: 'Umowa o dzieło', color: '#EC4899' },
            { type: 'types', name: 'Umowa handlowa', color: '#06B6D4' },
            { type: 'types', name: 'Umowa najmu', color: '#10B981' },
            { type: 'categories', name: 'HR', color: '#F97316' },
            { type: 'categories', name: 'Sprzedaż', color: '#84CC16' },
            { type: 'categories', name: 'Zakupy', color: '#14B8A6' },
            { type: 'categories', name: 'IT', color: '#6366F1' },
            { type: 'categories', name: 'Administracja', color: '#A855F7' },
        ];

        for (const dict of defaultDictionaries) {
            const existing = await dictionariesCollection.findOne({ type: dict.type, name: dict.name });
            if (!existing) {
                await dictionariesCollection.insertOne({
                    ...dict,
                    isActive: true,
                    order: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                console.log(`Created dictionary: ${dict.type} - ${dict.name}`);
            }
        }

        console.log('Seed completed successfully!');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
