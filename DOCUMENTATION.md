# Dokumentacja Systemu Zarządzania Umowami

**Wersja dokumentacji:** 1.0.0  
**Wersja aplikacji:** 1.4.0  
**Data aktualizacji:** Styczeń 2026

---

## Spis Treści

1. [Wprowadzenie](#1-wprowadzenie)
2. [Architektura Systemu](#2-architektura-systemu)
3. [Główne Funkcjonalności](#3-główne-funkcjonalności)
4. [Struktura Projektu](#4-struktura-projektu)
5. [Instrukcja Użytkowania](#5-instrukcja-użytkowania)
6. [API Endpoints](#6-api-endpoints)
7. [Role Użytkowników](#7-role-użytkowników)
8. [Bezpieczeństwo](#8-bezpieczeństwo)
9. [Konfiguracja](#9-konfiguracja)
10. [CHANGELOG](#10-changelog)
11. [Plany Rozwoju](#11-plany-rozwoju)

---

## 1. Wprowadzenie

### 1.1 Opis Projektu

System Zarządzania Umowami to zaawansowana aplikacja webowa przeznaczona do kompleksowej archiwizacji i zarządzania umowami biznesowymi. Projekt został zaprojektowany z myślą o automatyzacji procesów związanych z obiegiem dokumentów kontraktowych, wykorzystując najnowsze technologie z zakresu sztucznej inteligencji oraz optycznego rozpoznawania znaków (OCR).

System oferuje intuicyjny interfejs użytkownika z pełnym wsparciem dla trybu ciemnego, zaawansowane możliwości wyszukiwania oraz automatyczne generowanie podsumowań umów przy użyciu modeli językowych OpenAI. Dzięki hybrydowemu podejściu do OCR, aplikacja skutecznie przetwarza zarówno dokumenty tekstowe (PDF z warstwą tekstową), jak i skany dokumentów w formie obrazów.

Kluczowe cechy systemu obejmują wielopoziomowy system uprawnień użytkowników, zaawansowane filtrowanie i wyszukiwanie kontraktów, obsługę wielu podmiotów firmowych (multi-company) oraz automatyczne powiadomienia email z wykorzystaniem kolejki zadań BullMQ i Redis.

### 1.2 Przeznaczenie

Aplikacja jest dedykowana dla organizacji, które potrzebują:

- Centralizacji dokumentacji kontraktowej w jednym miejscu
- Automatyzacji procesu ekstrakcji danych z dokumentów PDF
- Inteligentnej analizy treści umów za pomocą AI
- Systematycznego śledzenia terminów ważności umów
- Kontrolowanego dostępu do poufnych dokumentów
- Współpracy wielu użytkowników z różnymi poziomami uprawnień

### 1.3 Główne Korzyści

| Korzyść | Opis |
|---------|------|
| **Oszczędność czasu** | Automatyczna ekstrakcja tekstu i generowanie podsumowań eliminuje ręczne przepisywanie danych |
| **Redukcja błędów** | Eliminacja pomyłek ludzkich przy przepisywaniu informacji z dokumentów |
| **Lepsza organizacja** | Przejrzysta struktura katalogów i zaawansowane filtry ułatwiają zarządzanie dokumentacją |
| **Bezpieczeństwo danych** | Wielopoziomowy system uprawnień chroni poufne informacje |
| **Zgodność prawna** | Śledzenie terminów ważności i automatyczne przypomnienia |

---

## 2. Architektura Systemu

### 2.1 Stack Technologiczny

System został zbudowany z wykorzystaniem nowoczesnego stosu technologicznego, zapewniającego wysoką wydajność, skalowalność oraz bezpieczeństwo:

**Frontend:**

- **Next.js 16+** - Framework React z obsługą App Router
- **TypeScript** - Typowany język programowania
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Komponenty UI oparte na Radix UI
- **React 19** - Najnowsza wersja biblioteki React

**Backend:**

- **Node.js** - Środowisko uruchomieniowe JavaScript
- **TypeScript** - Bezpieczeństwo typów w kodzie serwerowym
- **NextAuth.js v5** - System autentykacji i autoryzacji
- **Mongoose** - ODM dla MongoDB

**Baza Danych:**

- **MongoDB** - Nierelacyjna baza danych dokumentowa
- **Redis** - Magazyn klucz-wartość dla kolejek zadań

**AI i OCR:**

- **OpenAI API** - GPT-4o, GPT-4 Turbo, GPT-4o Mini
- **Tesseract OCR** - Lokalne rozpoznawanie tekstu (język polski)
- **LangChain** - Framework dla aplikacji LLM

**Narzędzia:**

- **BullMQ** - Kolejki zadań dla tła
- **Nodemailer** - Wysyłanie emaili przez SMTP
- **pdf-parse** - Ekstrakcja tekstu z PDF
- **poppler-utils** - Konwersja PDF na obrazy

### 2.2 Architektura Aplikacji

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Dashboard│  │  Contracts│  │  Upload   │  │  Settings   │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘  │
│        │              │              │               │          │
│        └──────────────┴──────────────┴───────────────┘          │
│                            │                                     │
│                    ┌───────▼───────┐                            │
│                    │  NextAuth.js  │                            │
│                    │   (Session)   │                            │
│                    └───────┬───────┘                            │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   REST API      │
                    │  (Next.js API)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌───────▼───────┐ ┌────────▼────────┐
│   MongoDB       │ │    Redis      │ │  System Plików  │
│   (Dokumenty)   │ │  (Kolejki)    │ │   (PDF, OCR)    │
└─────────────────┘ └───────────────┘ └─────────────────┘
```

### 2.3 Model Domeny

System operuje na następujących encjach głównych:

**Contract (Umowa)** - Centralna encja systemu przechowująca wszystkie informacje o kontraktach, włącznie z metadanymi, tekstem OCR, podsumowaniami AI oraz statusem przetwarzania.

**User (Użytkownik)** - Reprezentuje osoby korzystające z systemu, zawiera dane autentykacyjne, rolę oraz preferencje.

**Dictionary (Słownik)** - Encje konfiguracyjne przechowujące definicje statusów, typów umów, kategorii, klientów oraz innych wartości enumeratywnych.

**Note (Notatka)** - Komentarze i uwagi dołączane do poszczególnych umów przez użytkowników.

**Team (Zespół)** - Grupowanie użytkowników w zespoły dla organizacji pracy (w planach rozwoju).

**ContractActivity (Aktywność)** - Historia zmian i akcji wykonywanych na umowach (w planach rozwoju).

---

## 3. Główne Funkcjonalności

### 3.1 Zarządzanie Umowami

System oferuje pełny zakres operacji CRUD (Create, Read, Update, Delete) dla umów:

**Dodawanie umów:**

- Przesyłanie plików PDF metodą drag & drop
- Automatyczna numeracja umów w formacie `UM/YYYY/MM/XXX`
- Podgląd side-by-side dokumentu i formularza podczas wprowadzania danych
- Autouzupełnianie danych klienta na podstawie NIP
- Obsługa wielu podmiotów firmowych (multi-company)
- Przypisywanie kategorii, typów i osób odpowiedzialnych

**Edycja metadanych:**

- Modyfikacja wszystkich pól umowy (klient, status, daty, osoba odpowiedzialna)
- Dynamiczne pola dodatkowe zdefiniowane w słownikach
- Zachowanie pełnej historii zmian

**Przeglądanie i filtrowanie:**

- Rozwijany panel filtrów zaawansowanych
- Filtrowanie po: firmie, kliencie, statusie, kategorii, osobie odpowiedzialnej, typie umowy, zakresie dat
- Wizualny wskaźnik aktywnych filtrów
- Podświetlanie na czerwono umów wygasających w ciągu 30 dni
- Wyświetlanie daty zakończenia na liście umów

### 3.2 OCR i Sztuczna Inteligencja

#### Hybrid OCR

System wykorzystuje hybrydowe podejście do ekstrakcji tekstu z dokumentów PDF:

**Etap 1: pdf-parse** - Szybka ekstrakcja tekstu z dokumentów posiadających warstwę tekstową. Jeśli system wykryje wystarczającą ilość tekstu (>50 znaków), używa tego wyniku.

**Etap 2: Tesseract OCR** - Dla dokumentów skanowanych (obrazy), system konwertuje PDF na obrazy przy użyciu `pdftoppm`, a następnie przetwarza je lokalnie używając Tesseract OCR z językiem polskim.

**Etap 3: OpenAI Vision (fallback)** - Jeśli Tesseract nie wyekstrahuje wystarczającej jakości tekstu, system automatycznie używa OpenAI Vision API jako rozwiązania awaryjnego.

**Optymalizacje wydajności:**

- Sampling stron dla długich dokumentów (>10 stron: strona 1 + co 5 strona)
- Różne profile Tesseract (OEM 1 - LSTM, PSM 3 - Auto page segmentation)
- Buforowanie tymczasowych plików w katalogu systemowym

#### Podsumowania AI

Generowanie inteligentnych podsumowań umów przy użyciu modeli OpenAI:

- **Modele dostępne:** GPT-4o, GPT-4o Mini, GPT-4 Turbo
- **Treść podsumowania:** Strony umowy, dane stron, przedmiot umowy, okres obowiązywania, warunki płatności, termin wypowiedzenia, dane kontaktowe
- **Dostępność:** Podsumowanie dostępne w szczegółach umowy oraz na liście umów (przycisk "Pokaż Podsumowanie AI")
- **Bezpieczeństwo:** Maskowanie kluczy API, walidacja uprawnień użytkowników

### 3.3 Dashboard

Panel główny aplikacji oferujący szybki przegląd stanu systemu:

- **Podsumowanie kontraktów:** Liczba umów według statusu
- **Filtr "Wygasające umowy":** Umowy z datą zakończenia w ciągu najbliższych 30 dni (ignoruje puste daty)
- **Szybki dostęp:** Linki do najczęściej używanych funkcji
- **Statystyki:** Ogólna liczba umów, aktywnych klientów

### 3.4 System Notatek

Każda umowa posiada dedykowany system notatek umożliwiający:

- Dodawanie wielu notatek do pojedynczej umowy
- Edycję i usuwanie własnych notatek
- Przeszukiwanie treści notatek w globalnej wyszukiwarce
- Automatyczne logowanie czasu dodania notatki

### 3.5 Zarządzanie Słownikami

System słowników zapewnia centralizowaną konfigurację:

**Typy słowników:**

- **Statusy umów:** Aktywna, Zakończona, W trakcie, Wypowiedziana
- **Typy umów:** O dzieło, o pracę, NDA, Serwisowa, Najmu, Dystrybucyjna
- **Kategorie:** Finansowe, HR, IT, Marketing, Operacyjne
- **Osoby odpowiedzialne:** Lista pracowników
- **Firmy (multi-company):** Podmioty organizacji zarządzające umowami
- **Pola dodatkowe:** Dynamiczne definicje dodatkowych pól formularza
- **Klienci:** Dane kontrahentów (NIP, adres, telefon, email)

**Funkcjonalności:**

- CRUD dla elementów słowników
- Filtrowanie słowników po typie
- Dynamiczne uwzględnianie pól dodatkowych na liście umów

### 3.6 Wyszukiwarka

Zaawansowana wyszukiwarka przeszukująca:

- Tytuły umów
- Treść notatek
- Podsumowania AI
- Nazwy klientów
- Nazwy plików

Wyszukiwanie jest globalne i dostępne z poziomu panelu bocznego.

### 3.7 Powiadomienia Email

System automatycznych powiadomień z wykorzystaniem BullMQ i Redis:

**Zaimplementowane funkcje:**

- Powiadomienia email 5 minut po przesłaniu umowy
- Cotygodniowe raporty umów wygasających (<30 dni)
- Panel konfiguracji SMTP w ustawieniach administratora
- Funkcja "Test Connection" do weryfikacji konfiguracji SMTP

**Architektura tła:**

- Kolejki zadań BullMQ z Redis jako broker
- Instrumentation hook dla niezawodnego uruchamiania workerów
- Obsługa błędów i retry dla zadań

### 3.8 Interfejs Użytkownika

**Design:**

- Pełne wsparcie trybu ciemnego (Dark Mode)
- Przełącznik motywu w nagłówku aplikacji
- Responsywny design (desktop, tablet, mobile)
- Komponenty shadcn/ui dla spójności interfejsu

**Interakcje:**

- Powiadomienia Toast (sonner) dla akcji użytkownika
- Podgląd PDF side-by-side podczas dodawania umowy
- Możliwość pobierania oryginalnych plików PDF
- Wybór tekstu i kopiowanie w podglądzie PDF

---

## 4. Struktura Projektu

```
contracts-management-app/
├── .gitignore                  # Ignorowanie plików przez Git
├── CHANGELOG.md                # Historia zmian projektu
├── docker-compose.yml          # Konfiguracja Docker Compose
├── Dockerfile                  # Obraz Docker aplikacji
├── eslint.config.mjs           # Konfiguracja ESLint
├── next.config.ts              # Konfiguracja Next.js
├── package.json                # Zależności i skrypty npm
├── postcss.config.mjs          # Konfiguracja PostCSS
├── README.md                   # Podstawowa dokumentacja
├── README-Docker.md            # Instrukcja Docker
├── tsconfig.json               # Konfiguracja TypeScript
│
├── docker/                     # Konfiguracje Docker
│   └── mongo-init/
│       └── 01-init-database.js # Skrypt inicjalizacji MongoDB
│
├── plans/                      # Dokumentacja planów rozwoju
│   └── DEVELOPMENT_PLAN.md     # Plan rozwoju (wersja 2.0)
│
├── scripts/                    # Skrypty pomocnicze
│   ├── seed.ts                 # Inicjalizacja bazy danych
│   ├── start.sh                # Skrypt startowy
│   └── stop.sh                 # Skrypt zatrzymujący
│
└── src/                        # Kod źródłowy aplikacji
    ├── app/                    # Aplikacja Next.js (App Router)
    │   ├── (dashboard)/        # Grupa tras dashboardu
    │   │   ├── admin/          # Panel administracyjny
    │   │   │   ├── settings/   # Ustawienia systemu
    │   │   │   └── users/      # Zarządzanie użytkownikami
    │   │   ├── contracts/      # Zarządzanie umowami
    │   │   │   ├── [id]/       # Szczegóły umowy
    │   │   │   └── upload/     # Przesyłanie umów
    │   │   ├── dashboard/      # Panel główny
    │   │   ├── dictionaries/   # Zarządzanie słownikami
    │   │   └── search/         # Wyszukiwarka
    │   ├── api/                # API Routes
    │   │   ├── admin/          # Endpointy administracyjne
    │   │   ├── auth/           # NextAuth
    │   │   ├── contracts/      # CRUD umów
    │   │   └── dictionaries/   # CRUD słowników
    │   ├── favicon.ico         # Ikona aplikacji
    │   ├── globals.css         # Style globalne
    │   ├── layout.tsx          # Główny layout
    │   ├── login/              # Strona logowania
    │   └── page.tsx            # Strona główna przekierowująca
    │
    ├── components/             # Komponenty React
    │   ├── layout/             # Komponenty układu
    │   │   ├── Header.tsx      # Nagłówek aplikacji
    │   │   ├── Sidebar.tsx     # Panel boczny
    │   │   └── ThemeToggle.tsx # Przełącznik motywu
    │   ├── ocr-panel.tsx       # Panel OCR i AI
    │   ├── pdf/
    │   │   └── PDFViewer.tsx   # Podgląd PDF
    │   ├── providers/          # React Providers
    │   │   ├── SessionProvider.tsx
    │   │   └── ThemeProvider.tsx
    │   └── ui/                 # Komponenty shadcn/ui
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── input.tsx
    │       └── label.tsx
    │
    ├── lib/                    # Biblioteki i serwisy
    │   ├── ai-service.ts       # Serwis AI OpenAI
    │   ├── auth.ts             # Konfiguracja NextAuth
    │   ├── init-workers.ts     # Inicjalizacja workerów
    │   ├── mail.ts             # Serwis email (Nodemailer)
    │   ├── mongodb.ts          # Połączenie z MongoDB
    │   ├── ocr-service.ts      # Serwis OCR (Hybrid)
    │   ├── queue.ts            # Kolejki BullMQ
    │   ├── utils.ts            # Funkcje pomocnicze
    │   └── worker.ts           # Worker zadań tła
    │
    ├── models/                 # Modele Mongoose
    │   ├── Comment.ts          # Model komentarzy
    │   ├── Contract.ts         # Model umowy
    │   ├── ContractActivity.ts # Model aktywności
    │   ├── Dictionary.ts       # Model słownika
    │   ├── Note.ts             # Model notatki
    │   ├── Notification.ts     # Model powiadomienia
    │   ├── Settings.ts         # Model ustawień
    │   ├── Team.ts             # Model zespołu
    │   ├── TeamMember.ts       # Model członkostwa
    │   └── User.ts             # Model użytkownika
    │
    ├── types/                  # Definicje TypeScript
    │   └── next-auth.d.ts      # Typy NextAuth
    │
    └── instrumentation.ts      # Hook instrumentacji
```

---

## 5. Instrukcja Użytkowania

### 5.1 Instalacja

#### Wymagania wstępne

Przed uruchomieniem aplikacji upewnij się, że masz zainstalowane:

- Node.js 18 lub nowszy
- MongoDB (lokalna instancja lub MongoDB Atlas)
- Klucz API OpenAI (dla funkcji OCR i AI)
- Redis (dla kolejek zadań - opcjonalnie)
- Git

#### Instrukcja krok po kroku

**Krok 1: Pobranie repozytorium**

```bash
git clone <url-repozytorium>
cd contracts-management-app
```

**Krok 2: Instalacja zależności**

```bash
npm install
```

**Krok 3: Konfiguracja zmiennych środowiskowych**

Utwórz plik `.env.local` w katalogu głównym projektu:

```env
# Połączenie z bazą danych
MONGODB_URI=mongodb://localhost:27017/contracts_app

# Autentykacja NextAuth
NEXTAUTH_SECRET=twoj-sekretny-klucz-zmień-w-produkcji
NEXTAUTH_URL=http://localhost:3000

# OpenAI API (wymagane dla OCR i AI)
OPENAI_API_KEY=sk-twoj-klucz-openai

# Opcjonalnie: Redis dla kolejek BullMQ
REDIS_URL=redis://localhost:6379

# Opcjonalnie: SMTP dla powiadomień
SMTP_HOST=smtp.twoj-server.pl
SMTP_PORT=587
SMTP_USER=twoj-email@twoja-domena.pl
SMTP_PASSWORD=twoje-hasło-smtp
FROM_EMAIL=noreply@twoja-domena.pl

# Konfiguracja OCR
UPLOAD_DIR=./uploads
```

**Krok 4: Uruchomienie MongoDB**

Upewnij się, że MongoDB jest uruchomione:

```bash
# Linux/Mac
sudo systemctl start mongod

# Windows - uruchom usługę przez services.msc
```

**Krok 5: Inicjalizacja bazy danych**

```bash
npm run seed
```

Ten skrypt utworzy:

- Użytkownika administratora: `admin@example.com` / `admin123`
- Domyślne słowniki (statusy, typy umów, kategorie)
- Przykładowych klientów

**Krok 6: Uruchomienie aplikacji**

```bash
npm run dev
```

**Krok 7: Dostęp do aplikacji**

Otwórz przeglądarkę i przejdź do: [http://localhost:3000](http://localhost:3000)

Zaloguj się używając domyślnych danych:

- **Email:** <admin@example.com>
- **Hasło:** admin123

### 5.2 Korzystanie z funkcji OCR

**Przetwarzanie istniejącej umowy:**

1. Przejdź do szczegółów umowy
2. W sekcji "OCR i AI" wprowadź klucz API OpenAI (jeśli nie jest skonfigurowany globalnie)
3. Kliknij "Wyodrębnij tekst (OCR)" aby rozpoznać tekst z PDF
4. Poczekaj na zakończenie przetwarzania ( pasek postępu)
5. Kliknij "Generuj podsumowanie" aby stworzyć AI podsumowanie

**Podczas dodawania nowej umowy:**

1. Przejdź do "Dodaj umowę"
2. Przeciągnij plik PDF do strefy upload
3. Korzystaj z widoku Side-by-Side do wygodnego przepisywania danych
4. Kliknij "Generuj podsumowanie" aby AI automatycznie wypełniło pola

### 5.3 Zarządzanie użytkownikami

Panel administracyjny umożliwia:

1. **Dodawanie użytkowników:**
   - Przejdź do "Administracja" > "Użytkownicy"
   - Kliknij "Dodaj użytkownika"
   - Wypełnij dane formularza
   - Przypisz rolę (Admin, Edycja, Odczyt)

2. **Edycja użytkowników:**
   - Kliknij na użytkownika na liście
   - Modyfikuj dane
   - Zapisz zmiany

3. **Usuwanie użytkowników:**
   - Kliknij przycisk usuwania przy użytkowniku
   - Potwierdź usunięcie

### 5.4 Konfiguracja SMTP

1. Przejdź do "Administracja" > "Ustawienia"
2. W sekcji "SMTP Configuration" wprowadź dane serwera:
   - Host SMTP
   - Port
   - Użytkownik
   - Hasło
   - Adres nadawcy (FROM_EMAIL)
3. Kliknij "Test Connection" aby zweryfikować konfigurację
4. Zapisz ustawienia

---

## 6. API Endpoints

### 6.1 Autentykacja

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/auth/[...nextauth]` | Obsługa logowania (NextAuth) |

### 6.2 Kontrakty

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/contracts` | Lista umów (z paginacją i filtrowaniem) |
| POST | `/api/contracts` | Dodanie nowej umowy |
| GET | `/api/contracts/:id` | Szczegóły umowy |
| PUT | `/api/contracts/:id` | Aktualizacja umowy |
| DELETE | `/api/contracts/:id` | Usunięcie umowy |
| POST | `/api/contracts/upload` | Upload pliku PDF |
| GET | `/api/contracts/:id/notes` | Lista notatek umowy |
| POST | `/api/contracts/:id/notes` | Dodanie notatki |
| POST | `/api/contracts/:id/ocr` | Hybrid OCR i generowanie podsumowań AI |
| GET | `/api/contracts/:id/ocr` | Status przetwarzania OCR |
| GET | `/api/contracts/:id/activity` | Historia aktywności |
| POST | `/api/contracts/:id/assign` | Przydzielenie użytkownika |
| POST | `/api/contracts/:id/comments` | Dodanie komentarza |
| POST | `/api/contracts/:id/generate-description` | Generowanie opisu AI |
| GET | `/api/contracts/view/:filename` | Pobieranie/podgląd PDF |

**Parametry GET /api/contracts:**

```typescript
interface ContractsQuery {
    page?: number;       // Numer strony (domyślnie: 1)
    limit?: number;      // Elementów na stronie (domyślnie: 10)
    search?: string;     // Wyszukiwanie tekstowe
    status?: string;     // Filtrowanie po statusie
    client?: string;     // Filtrowanie po kliencie
    category?: string;   // Filtrowanie po kategorii
    type?: string;       // Filtrowanie po typie
    assignee?: string;   // Filtrowanie po osobie odpowiedzialnej
    company?: string;    // Filtrowanie po firmie
    dateFrom?: string;   // Data zakończenia od
    dateTo?: string;     // Data zakończenia do
    expiringInDays?: number; // Umowy wygasające w ciągu N dni
    sortBy?: string;     // Pole sortowania
    sortOrder?: 'asc' | 'desc'; // Kolejność sortowania
}
```

### 6.3 Słowniki

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/dictionaries` | Lista słowników (z parametrem `?type=TYPE`) |
| POST | `/api/dictionaries` | Dodanie elementu słownika |
| PUT | `/api/dictionaries/:id` | Aktualizacja elementu |
| DELETE | `/api/dictionaries/:id` | Usunięcie elementu |

### 6.4 Administracja

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/admin/migrate` | Migracja bazy danych |
| POST | `/api/admin/seed-db` | Seedowanie bazy danych |
| GET | `/api/admin/settings` | Pobranie ustawień |
| PUT | `/api/admin/settings` | Aktualizacja ustawień |
| POST | `/api/admin/settings/test-smtp` | Test połączenia SMTP |
| GET | `/api/admin/users` | Lista użytkowników |
| POST | `/api/admin/users` | Dodanie użytkownika |
| PUT | `/api/admin/users/:id` | Aktualizacja użytkownika |
| DELETE | `/api/admin/users/:id` | Usunięcie użytkownika |

### 6.5 Zespoły (Team Collaboration)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/teams` | Lista zespołów |
| POST | `/api/teams` | Utworzenie zespołu |
| GET | `/api/teams/:id` | Szczegóły zespołu |
| PUT | `/api/teams/:id` | Aktualizacja zespołu |
| DELETE | `/api/teams/:id` | Usunięcie zespołu |
| GET | `/api/teams/:id/members` | Członkowie zespołu |
| POST | `/api/teams/:id/members` | Dodanie członka zespołu |
| PUT | `/api/teams/:id/members/:userId` | Aktualizacja roli członka |
| DELETE | `/api/teams/:id/members/:userId` | Usunięcie członka zespołu |

### 6.6 Powiadomienia

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/notifications` | Lista powiadomień użytkownika |

---

## 7. Role Użytkowników

System wykorzystuje trzy poziomy uprawnień, zapewniając kontrolę dostępu do poszczególnych funkcji:

### 7.1 Administrator (Admin)

Pełny dostęp do wszystkich funkcji systemu:

- Zarządzanie użytkownikami (dodawanie, edycja, usuwanie)
- Konfiguracja ustawień systemowych (SMTP, OCR)
- Dostęp do wszystkich umów bez ograniczeń
- Wykonywanie operacji OCR i generowanie podsumowań AI
- Zarządzanie słownikami systemowymi
- Przeglądanie logów i historii zmian
- Migracja i seedowanie bazy danych

### 7.2 Edycja (Edit)

Ograniczony dostęp umożliwiający pracę z umowami:

- Dodawanie i edycja umów
- Przesyłanie plików PDF
- Wykonywanie operacji OCR i AI
- Zarządzanie notatkami
- Dostęp do wszystkich umów
- Zarządzanie słownikami (odczyt i zapis)
- Brak dostępu do zarządzania użytkownikami

### 7.3 Odczyt (Read)

Tylko podgląd bez możliwości modyfikacji:

- Przeglądanie listy umów
- Podgląd szczegółów umów
- Przeglądanie notatek
- Pobieranie plików PDF
- Brak dostępu do OCR i AI
- Brak możliwości edycji danych
- Brak dostępu do panelu administracyjnego

### 7.4 Macierz Uprawnień

| Funkcja | Admin | Edycja | Odczyt |
|---------|-------|--------|--------|
| Przeglądanie umów | ✅ | ✅ | ✅ |
| Dodawanie umów | ✅ | ✅ | ❌ |
| Edycja umów | ✅ | ✅ | ❌ |
| Usuwanie umów | ✅ | ❌ | ❌ |
| OCR i AI | ✅ | ✅ | ❌ |
| Zarządzanie notatkami | ✅ | ✅ | ❌ |
| Zarządzanie słownikami | ✅ | ✅ | ❌ |
| Zarządzanie użytkownikami | ✅ | ❌ | ❌ |
| Ustawienia systemowe | ✅ | ❌ | ❌ |
| Pobieranie PDF | ✅ | ✅ | ✅ |

---

## 8. Bezpieczeństwo

### 8.1 Autentykacja

System wykorzystuje NextAuth.js v5 z zabezpieczeniami:

- **Szyfrowanie haseł:** bcryptjs z salt rounds
- **Sesje:** JWT z secret key
- **CSRF Protection:** Wbudowana ochrona Next.js
- **Secure cookies:** HttpOnly, Secure (HTTPS only w produkcji)

### 8.2 Ochrona Danych

- **Maskowanie kluczy API:** Klucze OpenAI są maskowane w interfejsie
- **Walidacja uprawnień:** Każde żądanie API weryfikuje rolę użytkownika
- **Sanityzacja danych:** Ochrona przed XSS i injection
- **Rate limiting:** Ograniczenie liczby żądań

### 8.3 Ochrona Plików

- **Walidacja typów:** Sprawdzanie MIME type przy upload
- **Limit rozmiaru:** Maksymalny rozmiar pliku 20MB
- **Bezpieczne nazewnictwo:** Unikalne nazwy plików (UUID)
- **Izolacja plików:** Pliki dostępne tylko przez API z walidacją

### 8.4 Rekomendacje dla Produkcji

1. **HTTPS:** Wymuszenie połączenia szyfrowanego
2. **Silne hasła:** Polityka haseł (min. 12 znaków, znaki specjalne)
3. **Secret keys:** Unikalne, silne klucze NEXTAUTH_SECRET
4. **Monitoring:** Logowanie podejrzanych aktywności
5. **Backup:** Regularne kopie zapasowe MongoDB
6. **Redis:** Zabezpieczenie hasłem
7. **SMTPS:** Użycie szyfrowanego połączenia SMTP (port 465 lub STARTTLS)

---

## 9. Konfiguracja

### 9.1 Zmienne Środowiskowe

| Zmienna | Wymagane | Opis |
|---------|----------|------|
| `MONGODB_URI` | Tak | Connection string MongoDB |
| `NEXTAUTH_SECRET` | Tak | Secret do podpisu sesji JWT |
| `NEXTAUTH_URL` | Tak | URL aplikacji (<http://localhost:3000>) |
| `OPENAI_API_KEY` | Tak | Klucz API OpenAI |
| `REDIS_URL` | Nie | URL Redis dla kolejek BullMQ |
| `SMTP_HOST` | Nie | Host serwera SMTP |
| `SMTP_PORT` | Nie | Port serwera SMTP |
| `SMTP_USER` | Nie | Użytkownik SMTP |
| `SMTP_PASSWORD` | Nie | Hasło SMTP |
| `FROM_EMAIL` | Nie | Adres email nadawcy |
| `UPLOAD_DIR` | Nie | Katalog na pliki (domyślnie: ./uploads) |
| `NEXT_PUBLIC_APP_VERSION` | Nie | Wersja wyświetlana w UI |

### 9.2 Konfiguracja Docker

System zawiera pełną konfigurację Docker dla łatwego deploymentu:

**docker-compose.yml:**

- Serwis `app`: Aplikacja Next.js z Node.js
- Serwis `mongo`: Baza danych MongoDB
- Serwis `redis`: Kolejki zadań (opcjonalnie)

**Uruchomienie:**

```bash
docker-compose up -d
```

### 9.3 Wymagania Systemowe OCR

Dla funkcji Hybrid OCR wymagane są:

- **Linux:** `poppler-utils`, `tesseract-ocr`, `tesseract-ocr-data-pol`
- **Docker:** Pakiety instalowane w obrazie

---

## 10. CHANGELOG

### [1.4.0] - 2026-01-04

**Dodano:**

- **Automatyczne powiadomienia email** - Wysyłane 5 minut po przesłaniu umowy
- **Cotygodniowe raporty wygasających umów** - Umowy wygasające w ciągu 30 dni
- **Panel konfiguracji SMTP** - W ustawieniach administratora z funkcją "Test Connection"
- **Przetwarzanie zadań w tle** - BullMQ i Redis dla niezawodnych powiadomień
- **Instrumentation hook** - Niezawodne uruchamianie workerów w tle

### [1.2.4] - 2026-01-04

**Dodano:**

- **Zaawansowane filtrowanie** - Rozwijany panel filtrów na liście umów (firma, klient, status, kategoria, osoba odpowiedzialna, typ, zakres dat)
- **Obsługa Multi-Company** - Słownik "Firmy" dla zarządzania kontraktami wielu podmiotów
- **Dynamiczne filtry** - Automatyczne uwzględnianie pól dodatkowych z słownika
- **Poprawa UI Podsumowania AI** - Jednolite tło okna modalnego

### [1.2.3] - 2026-01-04

**Dodano:**

- **Hybrid OCR** - Obsługa skanów PDF (obrazy) z Tesseract OCR i OpenAI Vision jako fallback
- **Pobieranie PDF** - Możliwość pobrania oryginalnego pliku umowy
- **Autouzupełnianie** - Automatyczne wypełnianie danych klienta (NIP, adres, telefon)
- **Podgląd Side-by-Side** - Podczas przesyłania umowy
- **Podsumowanie AI na liście** - Przycisk otwierający czytelne okno modalne
- **Wyróżnienie wygasających umów** - Podkreślanie na czerwono dat w ciągu 30 dni
- **Rozszerzone wyszukiwanie** - Treść notatek, podsumowania AI, nazwa klienta

**Zmieniono:**

- **Optymalizacja OCR** - Bezpośrednie wywołanie `pdftoppm` dla lepszej wydajności

### [1.1.0] - 2026-01-04

**Dodano:**

- Automatyczna numeracja umów (format: UM/YYYY/MM/XXX)
- Edycja metadanych umowy
- Wizualny wskaźnik aktywnego filtra

**Zmieniono:**

- Przeniesiono "Podsumowanie AI" pod szczegóły umowy
- Optymalizacja walidacji dla starszych umów

**Bezpieczeństwo:**

- Zabezpieczono wyświetlanie błędów AI (maskowanie kluczy API)

### [1.0.9] - 2026-01-04

**Dodano:**

- Tryb ciemny (Dark Mode)
- Powiadomienia Toast (sonner)
- Nagłówek (Header) w panelu głównym
- Wyświetlanie wersji aplikacji

### [1.0.0] - 2025-12-23

**Inicjalizacja:**

- Start projektu: archiwizacja i zarządzanie umowami
- Integracja OCR i AI (OpenAI)
- Zarządzanie klientami i słownikami

---

## 11. Plany Rozwoju

Szczegółowy plan rozwoju znajduje się w pliku [`plans/DEVELOPMENT_PLAN.md`](plans/DEVELOPMENT_PLAN.md). Poniżej przedstawiono podsumowanie kierunków rozwoju.

### 11.1 Współpraca Grupowa (Team Collaboration)

System zostanie rozbudowany o zaawansowane funkcje współpracy zespołowej:

**Zarządzanie zespołami:**

- Tworzenie zespołów z nazwą i opisem
- Zapraszanie członków przez email
- Role w zespole: Owner, Admin, Member, Viewer
- Konfiguracja typów umów dostępnych dla zespołu

**Przydzielanie i śledzenie:**

- Przydzielanie umów do konkretnych członków
- Widok "Moje przydzielone umowy"
- Dashboard zespołu z podsumowaniem aktywności
- Priorytety umów (wysoki, średni, niski)
- Termin realizacji dla zadań

**Komentarze i dyskusje:**

- Komentarze wątkowe przy umowach
- @wzmianki członków zespołu
- Powiadomienia o nowych komentarzach

**Historia i audyt:**

- Automatyczne logowanie wszystkich akcji
- Oś czasu aktywności dla każdej umowy
- Porównywanie wersji metadanych
- Eksport historii do CSV/PDF

### 11.2 Podpisy Kwalifikowane (Qualified Electronic Signatures)

Integracja z zewnętrznymi dostawcami podpisów elektronicznych:

**Obsługiwani dostawcy:**

- BiznesPlatform (Polska)
- Sigillum (Asseco)
- Autenti
- Adobe Acrobat Sign
- DocuSign

**Funkcjonalności:**

- Konfiguracja dostawców podpisów
- Dodawanie wielu podpisujących z kolejnością
- Śledzenie statusu podpisu w czasie rzeczywistym
- Automatyczne przypomnienia dla niepodpisanych
- Webhook do odbierania statusu podpisu
- Weryfikacja integralności dokumentu po podpisie
- Pobieranie podpisanego dokumentu

### 11.3 Harmonogram Implementacji

| Faza | Zakres | Priorytet |
|------|--------|-----------|
| **Faza 1** | Model danych Team i TeamMember, API CRUD zespołów | Wysoki |
| **Faza 2** | Przydzielanie umów, dashboard zespołowy | Wysoki |
| **Faza 3** | System komentarzy, historia aktywności | Średni |
| **Faza 4** | System powiadomień | Średni |
| **Faza 5** | Model podpisów, interfejs ISignatureProvider | Wysoki |
| **Faza 6** | Pierwszy dostawca podpisów (np. BiznesPlatform) | Wysoki |
| **Faza 7** | Webhook statusu podpisów | Średni |
| **Faza 8** | Weryfikacja podpisów, pobieranie dokumentów | Średni |
| **Faza 9** | Powiadomienia email o statusie podpisów | Niższy |
| **Faza 10** | Raportowanie i eksport | Niższy |

### 11.4 Nowe Funkcje w Planach

| Funkcja | Status | Opis |
|---------|--------|------|
| Vector Search | 🚧 Planowane | Wyszukiwanie semantyczne z LangChain |
| Chat z umową (RAG) | 🚧 Planowane | Interakcja z dokumentami przez AI |
| Integracja LDAP | 🚧 Planowane | Logowanie przez Windows Domain |
| Podpisy kwalifikowane | 🚧 Planowane | Integracja z dostawcami e-podpisów |
| Współpraca grupowa | 🚧 Planowane | Zespoły, komentarze, audyt |

---

## 12. Wsparcie i Kontakt

### 12.1 Dokumentacja

- **Dokumentacja użytkownika:** Patrz sekcja [Instrukcja Użytkowania](#5-instrukcja-użytkowania)
- **Dokumentacja API:** Patrz sekcja [API Endpoints](#6-api-endpoints)
- **Plan rozwoju:** Patrz [`plans/DEVELOPMENT_PLAN.md`](plans/DEVELOPMENT_PLAN.md)

### 12.2 Znane Problema

1. **OCR na dużych dokumentach** - Przetwarzanie może być wolne dla dokumentów >50 stron
2. **Tesseract na Windows** - Wymaga ręcznej instalacji i konfiguracji PATH
3. **Redis w produkcji** - Wymaga konfiguracji persistencji dla produkcji

### 12.3 Licencja

MIT License - zobacz plik LICENSE w repozytorium.

---

*Dokumentacja wygenerowana dla wersji 1.4.0 aplikacji System Zarządzania Umowami.*
