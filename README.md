# System Zarządzania Umowami

**Aplikacja do archiwizacji i zarządzania umowami z funkcjami OCR i AI.**

* Docker Compose? Sprawdż @README-Docker.md

## Stack Technologiczny

* **Frontend:** Next.js 15+ (App Router) + Tailwind CSS + shadcn/ui
* **Backend:** Node.js + TypeScript
* **Baza danych:** MongoDB
* **Autoryzacja:** NextAuth.js
* **AI/OCR:** OpenAI API (GPT-4o-mini) + Tesseract OCR (Hybrid Mode)
* **Narzędzia PDF:** `poppler-utils` (pdftoppm), `pdf-parse`

## Wymagania

* Node.js 18+
* MongoDB (lokalna lub MongoDB Atlas)
* Klucz API OpenAI (dla funkcji OCR i AI)
* npm lub yarn
* **Systemowe (Linux/Docker):** `poppler-utils`, `tesseract-ocr`, `tesseract-ocr-data-pol`

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
   * Użytkownika admin: `admin@example.com` / `admin123`
   * Domyślne słowniki (statusy, typy umów, kategorie)

6. **Uruchom aplikację w trybie deweloperskim:**

   ```bash
   npm run dev
   ```

7. **Otwórz przeglądarkę:**

   Przejdź do [http://localhost:3000](http://localhost:3000)

## Logowanie

Domyślne dane logowania:

* **Email:** <admin@example.com>
* **Hasło:** admin123

## Funkcjonalności

### Zaimplementowane ✅

* [x] System autoryzacji z rolami (Admin, Edycja, Odczyt)
* [x] Dashboard z przeglądem systemu
* [x] CRUD dla umów (dodawanie, edycja, usuwanie)
* [x] Upload plików PDF z drag & drop
* [x] Zarządzanie słownikami (klienci, typy umów, statusy, kategorie, osoby)
* [x] System notatek dla każdej umowy
* [x] Wyszukiwarka umów
* [x] Responsywny interfejs użytkownika
* [x] **Hybrid OCR** - ekstrakcja tekstu z PDF (płaskie pliki) i skanów (obrazy) przy użyciu Tesseract OCR + OpenAI Vision
* [x] **AI** - podsumowania umów (GPT-4o) i interaktywny modal na liście umów
* [x] **Pobieranie plików** - możliwość pobrania oryginalnego PDF
* [x] **Formularze** - autouzupełnianie danych klienta (NIP, adres) oraz widok **Side-by-Side** z podglądem PDF podczas dodawania
* [x] **Ciemny motyw (Dark Mode)** - pełne wsparcie dla trybu jasnego i ciemnego
* [x] **Zaawansowane wyszukiwanie** - przeszukiwanie treści notatek, nazw plików i podsumowań AI
* [x] **Bezpieczne zarządzanie kluczami API** (maskowanie, walidacja)
* [x] **Wersjonowanie** - automatyczne wyświetlanie wersji aplikacji i changelog
* [x] **Powiadomienia Toast** - atrakcyjne powiadomienia o sukcesach i błędach (sonner)

### Do implementacji w kolejnych fazach 🚧

* [ ] Vector Search - wyszukiwanie semantyczne
* [ ] Powiadomienia mailowe - konfiguracja servera SMTP - powiadomienia o nowej umowie dodanej do bazy do osoby odpowiedzialnej, powiadomienia o zbliżającym się terminie ważności 14 dni przed.
* [ ] Chat z umową (RAG z LangChain)
* [ ] Integracja z Windows Domain (LDAP)

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

* `POST /api/auth/[...nextauth]` - NextAuth handlers

### Umowy

* `GET /api/contracts` - Lista umów (z paginacją i filtrowaniem)
* `POST /api/contracts` - Dodanie nowej umowy
* `GET /api/contracts/:id` - Szczegóły umowy
* `PUT /api/contracts/:id` - Aktualizacja umowy
* `DELETE /api/contracts/:id` - Usunięcie umowy
* `POST /api/contracts/upload` - Upload pliku PDF
* `GET /api/contracts/:id/notes` - Notatki do umowy
* `POST /api/contracts/:id/notes` - Dodanie notatki
* `POST /api/contracts/:id/ocr` - **Hybrid OCR i generowanie podsumowań AI**
* `GET /api/contracts/:id/ocr` - **Status OCR umowy**
* `GET /api/contracts/view/:filename?download=true` - **Pobieranie PDF**

### Słowniki

* `GET /api/dictionaries?type=TYPE` - Lista słowników danego typu
* `POST /api/dictionaries` - Dodanie elementu słownika
* `PUT /api/dictionaries/:id` - Aktualizacja elementu
* `DELETE /api/dictionaries/:id` - Usunięcie elementu

## Funkcjonalność OCR i AI

### Możliwości

* **Hybrid OCR:** Automatyczne rozpoznawanie tekstu z przesłanych dokumentów PDF (zarówno tekstowych jak i skanów/obrazów) przy użyciu Tesseract OCR. W przypadku problemów, system automatycznie próbuje użyć OpenAI Vision.
* **Generowanie podsumowań:** Inteligentne podsumowania umów z wykorzystaniem AI (GPT-4o).
* **Bezpieczeństwo:** Maskowanie kluczy API, walidacja uprawnień użytkowników.
* **Status przetwarzania:** Monitorowanie postępu OCR i generowania podsumowań.

### Użycie

1. Przejdź do szczegółów umowy
2. W sekcji "OCR i AI" wprowadź klucz API OpenAI (jeśli nie jest skonfigurowany globalnie)
3. Kliknij "Wyodrębnij tekst (OCR)" aby rozpoznać tekst z PDF
4. Kliknij "Generuj podsumowanie" aby stworzyć AI podsumowanie (dostępne również w widoku listy przez przycisk "Pokaż Podsumowanie AI")
5. Podczas dodawania nowej umowy skorzystaj z widoku **Side-by-Side**, aby wygodnie przepisywać dane z dokumentu do formularza.

### Dostępne modele

* **GPT-4o:** Najnowszy model multimodalny, najlepszy dla OCR i analizy dokumentów.
* **Tesseract OCR (język polski):** Wykorzystywany jako podstawowy silnik OCR dla skanów, zapewniając szybkość i prywatność (działa lokalnie).

## Role użytkowników

* **Admin** - pełny dostęp, zarządzanie użytkownikami, OCR i AI
* **Edycja** - dodawanie i edycja umów, słowników, OCR i AI
* **Odczyt** - tylko przeglądanie (brak dostępu do OCR i AI)

## Licencja

MIT
