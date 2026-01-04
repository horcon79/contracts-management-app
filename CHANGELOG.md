# Changelog

Wszystkie istotne zmiany w tym projekcie beda dokumentowane w tym pliku.

## [1.2.2] - 2026-01-04

### Dodano

- **Hybrid OCR**: Obsługa skanwanych dokumentów PDF (obrazy) za pomocą Tesseract OCR z fallbackiem do OpenAI Vision.
- **Pobieranie PDF**: Możliwość pobrania oryginalnego pliku umowy z widoku szczegółów.
- **Autouzupełnianie**: Automatyczne wypełnianie danych klienta (NIP, Adres, Telefon) w formularzu dodawania umowy.
- **Tryb ciemny**: Dodanie trybu ciemnego z przełącznikiem w nagłówku.
- **Powiadomienia Toast**: Dodanie powiadomień Toast (sonner) dla lepszej interakcji z użytkownikiem.
- **Nagłówek (Header)**: Dodanie nagłówka (Header) w panelu głównym.
- **Wyszukiwanie**: Rozszerzone wyszukiwanie o treść notatek, podsumowania AI oraz nazwę klienta.
- **Wygasające umowy**: Filtr w dashboardzie bierze teraz pod uwagę tylko umowy z określoną datą zakończenia.

### Zmieniono

- **Optymalizacja OCR**: Zastosowano bezpośrednie wywołanie systemowego `pdftoppm` dla lepszej wydajności i stabilności na Linuxie.
- **Obsługa błędów**: Ulepszono komunikaty błędów OCR dla użytkownika.

## [1.1.0] - 2026-01-04

### Dodano

- Automatyczna numeracja umów (format UM/YYYY/MM/XXX).
- Edycja metadanych umowy (Klient, Status, Daty, itp.).
- Wizualny wskaźnik aktywnego filtra na liście umów.

### Zmieniono

- Przeniesiono sekcję "Podsumowanie AI" pod szczegóły umowy.
- Zoptymalizowano walidację (obsługa starszych umów bez numeru).

### Bezpieczeństwo

- Zabezpieczono wyświetlanie błędów AI (ukrywanie kluczy API).

### Naprawiono

- Filtr "Aktywne umowy" po przejściu z Dashboardu.

## [1.0.9] - 2026-01-04

### Dodano

- Tryb ciemny (Dark Mode) z przełącznikiem w nagłówku.
- Powiadomienia Toast (sonner) dla lepszej interakcji z użytkownikiem.
- Nagłówek (Header) w panelu głównym.
- Wyświetlanie wersji aplikacji w pasku bocznym.

## [1.0.0] - 2025-12-23

### Inicjalizacja

- Start projektu: Archiwizacja i zarządzanie umowami.
- Integracja OCR i AI (OpenAI).
- Zarządzanie klientami i słownikami.
