// Inicjalizacja bazy danych contracts_app
// Ten skrypt wykona się automatycznie przy pierwszym uruchomieniu MongoDB

print('=== INICJALIZACJA BAZY DANYCH CONTRACTS_APP ===');

// Przełącz na bazę contracts_app
db = db.getSiblingDB('contracts_app');

// Tworzenie użytkownika aplikacji z odpowiednimi uprawnieniami
db.createUser({
    user: 'contracts_app_user',
    pwd: 'contracts_app_password',
    roles: [
        {
            role: 'readWrite',
            db: 'contracts_app'
        }
    ]
});

print('✓ Utworzono użytkownika contracts_app_user');

// Tworzenie kolekcji z podstawowymi indeksami
db.createCollection('users');
db.createCollection('contracts');
db.createCollection('dictionaries');
db.createCollection('notes');

print('✓ Utworzono podstawowe kolekcje');

// Tworzenie indeksów dla kolekcji contracts
db.contracts.createIndex({ title: 'text', ocrText: 'text', description: 'text' });
db.contracts.createIndex({ 'metadata.client': 1 });
db.contracts.createIndex({ 'metadata.contractType': 1 });
db.contracts.createIndex({ 'metadata.status': 1 });
db.contracts.createIndex({ createdAt: -1 });
db.contracts.createIndex({ 'vectorEmbedding': '2dsphere' });

print('✓ Utworzono indeksy dla kolekcji contracts');

// Tworzenie indeksów dla kolekcji users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

print('✓ Utworzono indeksy dla kolekcji users');

// Tworzenie indeksów dla kolekcji dictionaries
db.dictionaries.createIndex({ type: 1 });
db.dictionaries.createIndex({ type: 1, isActive: 1 });

print('✓ Utworzono indeksy dla kolekcji dictionaries');

// Tworzenie indeksów dla kolekcji notes
db.notes.createIndex({ contractId: 1 });
db.notes.createIndex({ createdAt: -1 });

print('✓ Utworzono indeksy dla kolekcji notes');

// Wstawienie podstawowych słowników
db.dictionaries.insertMany([
    // Klienci
    { type: 'clients', name: 'ABC Company', color: '#3B82F6', isActive: true },
    { type: 'clients', name: 'XYZ Corp', color: '#10B981', isActive: true },

    // Typy umów
    { type: 'types', name: 'Umowa o pracę', color: '#F59E0B', isActive: true },
    { type: 'types', name: 'Umowa zlecenie', color: '#EF4444', isActive: true },
    { type: 'types', name: 'Umowa o dzieło', color: '#8B5CF6', isActive: true },
    { type: 'types', name: 'Kontrakt handlowy', color: '#06B6D4', isActive: true },

    // Statusy
    { type: 'statuses', name: 'Aktywna', color: '#10B981', isActive: true },
    { type: 'statuses', name: 'Wygasła', color: '#EF4444', isActive: true },
    { type: 'statuses', name: 'W trakcie negocjacji', color: '#F59E0B', isActive: true },
    { type: 'statuses', name: 'Zakończona', color: '#6B7280', isActive: true },

    // Kategorie
    { type: 'categories', name: 'HR', color: '#EC4899', isActive: true },
    { type: 'categories', name: 'Sprzedaż', color: '#3B82F6', isActive: true },
    { type: 'categories', name: 'IT', color: '#10B981', isActive: true },
    { type: 'categories', name: 'Marketing', color: '#F59E0B', isActive: true },

    // Osoby odpowiedzialne
    { type: 'persons', name: 'Jan Kowalski', color: '#6366F1', isActive: true },
    { type: 'persons', name: 'Anna Nowak', color: '#EC4899', isActive: true },
    { type: 'persons', name: 'Piotr Wiśniewski', color: '#10B981', isActive: true }
]);

print('✓ Wstawiono podstawowe słowniki');

// Test podstawowych operacji
const testUser = {
    name: 'Administrator',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true,
    createdAt: new Date()
};

db.users.insertOne(testUser);
print('✓ Wstawiono użytkownika testowego admin@example.com');

// Sprawdzenie wyników
print('\n=== PODSUMOWANIE INICJALIZACJI ===');
print(`Użytkownicy: ${db.users.countDocuments()}`);
print(`Umowy: ${db.contracts.countDocuments()}`);
print(`Słowniki: ${db.dictionaries.countDocuments()}`);
print(`Notatki: ${db.notes.countDocuments()}`);

print('\n✅ Baza danych contracts_app została pomyślnie zainicjalizowana!');
print('🔑 Użyj credentials: contracts_app_user / contracts_app_password');
