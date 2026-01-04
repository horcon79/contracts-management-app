# System Zarządzania Umowami

Aplikacja do archiwizacji i zarządzania umowami z funkcjami OCR i AI.

## Stack Technologiczny

- **Frontend:** Next.js 15+ (App Router) + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + TypeScript
- **Baza danych:** MongoDB
- **Autoryzacja:** NextAuth.js
- **AI/OCR:** OpenAI API (GPT-4o, GPT-4 Turbo)

## Wymagania

- Node.js 18+
- MongoDB (lokalna lub MongoDB Atlas)
- Klucz API OpenAI (dla funkcji OCR i AI)
- npm lub yarn

## Instalacja

1. **Sklonuj repozytorium i przejdź do folderu:**

   ```bash
   cd contracts-app
   ```

2. **Zainstaluj zależności:**

   ```bash
   npm install
   ```

3. **Skonfiguruj zmienne środowiskowe:**

   Utwórz plik `.env.local` (lub edytuj istniejący):

   ```env
   MONGODB_URI=mongodb://localhost:27017/contracts_app
   NEXTAUTH_SECRET=your-secret-key-change-in-production
   NEXTAUTH_URL=http://localhost:3000
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

4. **Uruchom MongoDB:**

   Upewnij się, że MongoDB jest uruchomione lokalnie lub użyj MongoDB Atlas.

5. **Zainicjuj bazę danych (seed):**

   ```bash
   npm run seed
   ```

   To utworzy:
   - Użytkownika admin: `admin@example.com` / `admin123`
   - Domyślne słowniki (statusy, typy umów, kategorie)

6. **Uruchom aplikację w trybie deweloperskim:**

   ```bash
   npm run dev
   ```

7. **Otwórz przeglądarkę:**

   Przejdź do [http://localhost:3000](http://localhost:3000)

## Logowanie

Domyślne dane logowania:

- **Email:** <admin@example.com>
- **Hasło:** admin123

## Funkcjonalności

### Zaimplementowane ✅

- [x] System autoryzacji z rolami (Admin, Edycja, Odczyt)
- [x] Dashboard z przeglądem systemu
- [x] CRUD dla umów (dodawanie, edycja, usuwanie)
- [x] Upload plików PDF z drag & drop
- [x] Zarządzanie słownikami (klienci, typy umów, statusy, kategorie, osoby)
- [x] System notatek dla każdej umowy
- [x] Wyszukiwarka umów
- [x] Responsywny interfejs użytkownika
- [x] **OCR - ekstrakcja tekstu z PDF** (OpenAI GPT-4o)
- [x] **AI - podsumowania umów** (OpenAI GPT-4o, GPT-4 Turbo)
- [x] **Bezpieczne zarządzanie kluczami API** (maskowanie, walidacja)
- [x] **Wybór modelu AI** (GPT-4o, GPT-4o Mini, GPT-4 Turbo)

### Do implementacji w kolejnych fazach 🚧

- [ ] Vector Search - wyszukiwanie semantyczne
- [ ] Chat z umową (RAG z LangChain)
- [ ] Integracja z Windows Domain (LDAP)
- [ ] Przeglądarka PDF w aplikacji
- [ ] Panel administracyjny użytkowników

## Struktura projektu

```
contracts-app/
├── scripts/
│   └── seed.ts              # Skrypt inicjalizacji bazy danych
├── src/
│   ├── app/
│   │   ├── (dashboard)/     # Strony chronione (po zalogowaniu)
│   │   │   ├── contracts/   # Zarządzanie umowami
│   │   │   ├── dashboard/   # Strona główna
│   │   │   ├── dictionaries/# Słowniki
│   │   │   └── search/      # Wyszukiwarka
│   │   ├── api/             # API Routes
│   │   │   ├── auth/        # NextAuth endpoints
│   │   │   ├── contracts/   # CRUD umów + OCR endpoints
│   │   │   └── dictionaries/# CRUD słowników
│   │   └── login/           # Strona logowania
│   ├── components/
│   │   ├── layout/          # Komponenty layoutu
│   │   ├── providers/       # React providers
│   │   ├── ui/              # Komponenty UI (shadcn)
│   │   └── ocr-panel.tsx    # Panel OCR i AI
│   ├── lib/
│   │   ├── auth.ts          # Konfiguracja NextAuth
│   │   ├── mongodb.ts       # Połączenie z MongoDB
│   │   ├── utils.ts         # Funkcje pomocnicze
│   │   └── ocr-service.ts   # Serwis OCR z OpenAI
│   ├── models/              # Modele Mongoose
│   │   ├── Contract.ts      # (rozszerzony o ocrText, aiSummary)
│   │   ├── Dictionary.ts
│   │   ├── Note.ts
│   │   └── User.ts
│   └── types/               # Typy TypeScript
├── uploads/                 # Folder na przesłane pliki PDF
└── .env.local               # Zmienne środowiskowe
```

## API Endpoints

### Autoryzacja

- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Umowy

- `GET /api/contracts` - Lista umów (z paginacją i filtrowaniem)
- `POST /api/contracts` - Dodanie nowej umowy
- `GET /api/contracts/:id` - Szczegóły umowy
- `PUT /api/contracts/:id` - Aktualizacja umowy
- `DELETE /api/contracts/:id` - Usunięcie umowy
- `POST /api/contracts/upload` - Upload pliku PDF
- `GET /api/contracts/:id/notes` - Notatki do umowy
- `POST /api/contracts/:id/notes` - Dodanie notatki
- `POST /api/contracts/:id/ocr` - **OCR i generowanie podsumowań AI**
- `GET /api/contracts/:id/ocr` - **Status OCR umowy**

### Słowniki

- `GET /api/dictionaries?type=TYPE` - Lista słowników danego typu
- `POST /api/dictionaries` - Dodanie elementu słownika
- `PUT /api/dictionaries/:id` - Aktualizacja elementu
- `DELETE /api/dictionaries/:id` - Usunięcie elementu

## Funkcjonalność OCR i AI

### Możliwości

- **Ekstrakcja tekstu z PDF:** Automatyczne rozpoznawanie tekstu z przesłanych dokumentów PDF
- **Generowanie podsumowań:** Inteligentne podsumowania umów z wykorzystaniem AI
- **Wybór modelu:** Możliwość wyboru między GPT-4o, GPT-4o Mini, GPT-4 Turbo
- **Bezpieczeństwo:** Maskowanie kluczy API, walidacja uprawnień użytkowników
- **Status przetwarzania:** Monitorowanie postępu OCR i generowania podsumowań

### Użycie

1. Przejdź do szczegółów umowy
2. W sekcji "OCR i AI" wprowadź klucz API OpenAI
3. Wybierz odpowiedni model AI
4. Kliknij "Wyodrębnij tekst (OCR)" aby rozpoznać tekst z PDF
5. Kliknij "Generuj podsumowanie" aby stworzyć AI podsumowanie

### Dostępne modele

- **GPT-4o:** Najnowszy model multimodalny, najlepszy dla OCR i analizy dokumentów
- **GPT-4o Mini:** Szybszy i tańszy model, dobry dla podstawowych zadań OCR
- **GPT-4 Turbo:** Wydajny model do analizy złożonych dokumentów

## Role użytkowników

- **Admin** - pełny dostęp, zarządzanie użytkownikami, OCR i AI
- **Edycja** - dodawanie i edycja umów, słowników, OCR i AI
- **Odczyt** - tylko przeglądanie (brak dostępu do OCR i AI)

## Licencja

MIT
