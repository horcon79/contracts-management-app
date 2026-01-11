import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Notification, { INotification } from '@/models/Notification';
import mongoose from 'mongoose';

/**
 * GET /api/notifications
 * Pobiera listę powiadomień zalogowanego użytkownika
 */
export async function GET(request: NextRequest) {
    try {
        // Weryfikacja autoryzacji
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - brak sesji użytkownika' },
                { status: 401 }
            );
        }

        // Parsowanie parametrów query
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const type = searchParams.get('type');

        // Walidacja parametrów
        if (page < 1 || limit < 1 || limit > 100) {
            return NextResponse.json(
                { error: 'Nieprawidłowe parametry paginacji' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId(session.user.id);

        // Budowanie zapytania
        const query: Record<string, unknown> = { userId };
        if (unreadOnly) {
            query.isRead = false;
        }
        if (type) {
            query.type = type;
        }

        // Pobieranie powiadomień z paginacją
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
        ]);

        // Obliczanie liczby nieprzeczytanych powiadomień (bez filtrów)
        const unreadCount = await Notification.countDocuments({
            userId,
            isRead: false,
        });

        // Formatowanie powiadomień
        const formattedNotifications = notifications.map((notification) => ({
            _id: notification._id.toString(),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            relatedEntityType: notification.relatedEntityType,
            relatedEntityId: notification.relatedEntityId?.toString(),
            contractId: notification.contractId?.toString(),
            isRead: notification.isRead,
            readAt: notification.readAt,
            createdAt: notification.createdAt,
        }));

        return NextResponse.json({
            notifications: formattedNotifications,
            unreadCount,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Błąd podczas pobierania powiadomień:', error);
        return NextResponse.json(
            { error: 'Wewnętrzny błąd serwera' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/notifications
 * Oznacza powiadomienia jako przeczytane
 */
export async function PUT(request: NextRequest) {
    try {
        // Weryfikacja autoryzacji
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized - brak sesji użytkownika' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { notificationIds, markAllAsRead } = body;

        // Walidacja danych wejściowych
        if (!notificationIds && !markAllAsRead) {
            return NextResponse.json(
                {
                    error: 'Wymagane jest podanie notificationIds lub markAllAsRead=true',
                },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const userId = new mongoose.Types.ObjectId(session.user.id);
        const now = new Date();

        if (markAllAsRead) {
            // Oznacz wszystkie powiadomienia jako przeczytane
            const result = await Notification.updateMany(
                {
                    userId,
                    isRead: false,
                },
                {
                    $set: {
                        isRead: true,
                        readAt: now,
                    },
                }
            );

            return NextResponse.json({
                success: true,
                modifiedCount: result.modifiedCount,
                message: 'Wszystkie powiadomienia oznaczono jako przeczytane',
            });
        }

        if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
            // Oznacz konkretne powiadomienia jako przeczytane
            // Walidacja, czy wszystkie ID należą do użytkownika
            const objectIds = notificationIds.map(
                (id: string) => new mongoose.Types.ObjectId(id)
            );

            // Sprawdzenie własności powiadomień
            const notifications = await Notification.find({
                _id: { $in: objectIds },
                userId,
            }).select('_id');

            const validIds = notifications.map((n) => n._id);

            if (validIds.length === 0) {
                return NextResponse.json(
                    { error: 'Nie znaleziono powiadomień do aktualizacji' },
                    { status: 404 }
                );
            }

            const result = await Notification.updateMany(
                {
                    _id: { $in: validIds },
                    isRead: false,
                },
                {
                    $set: {
                        isRead: true,
                        readAt: now,
                    },
                }
            );

            return NextResponse.json({
                success: true,
                modifiedCount: result.modifiedCount,
                message: `Oznaczono ${result.modifiedCount} powiadomień jako przeczytane`,
            });
        }

        return NextResponse.json(
            { error: 'Nieprawidłowe dane wejściowe' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Błąd podczas aktualizacji powiadomień:', error);
        return NextResponse.json(
            { error: 'Wewnętrzny błąd serwera' },
            { status: 500 }
        );
    }
}
