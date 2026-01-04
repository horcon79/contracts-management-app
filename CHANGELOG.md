# Changelog

Wszystkie istotne zmiany w tym projekcie beda dokumentowane w tym pliku.

## [1.2.4] - 2026-01-04

### Dodano

- **Zaawansowane Filtrowanie**: Dodano rozwijany panel filtrów na liście umów, pozwalający na precyzyjne wyszukiwanie po firmie, kliencie, statusie, kategorii, osobie odpowiedzialnej, typie umowy oraz zakresie dat zakończenia.
- **Obsługa Multi-Company**: Wprowadzono słownik "Firmy" (podmioty umów), umożliwiając zarządzanie kontraktami dla wielu własnych podmiotów.
- **Dynamiczne Filtry**: Filtry na liście umów automatycznie uwzględniają pola zdefiniowane w słowniku "Pola dodatkowe".
- **Poprawa UI Podsumowania AI**: Zmiana tła okna modalnego na jednolite dla lepszej czytelności tekstu.

## [1.2.3] - 2026-01-04

### Dodano

- **Hybrid OCR**: Obsługa skanwanych dokumentów PDF (obrazy) za pomocą Tesseract OCR z fallbackiem do OpenAI Vision.
- **Pobieranie PDF**: Możliwość pobrania oryginalnego pliku umowy z widoku szczegółów.
- **Autouzupełnianie**: Automatyczne wypełnianie danych klienta (NIP, Adres, Telefon) w formularzu dodawania umowy.
- [x] Implement Side-by-Side PDF Preview during contract upload
- [x] Enable text selection/copying in PDFViewer
- **Podsumowanie AI na liście**: Zmiana sposobu wyświetlania z popupu po najechaniu myszką na dedykowany przycisk "Pokaż Podsumowanie AI" otwierający czytelne okno modalne.
- **Wyróżnienie wygasających umów**: Podkreślenie na czerwono daty zakończenia umowy, jeśli przypada w ciągu najbliższych 30 dni.
- [x] Add End Date to contract list items
- **Wyszukiwanie**: Rozszerzone wyszukiwanie o treść notatek, podsumowania AI oraz nazwę klienta.
- [x] Refine "Expiring Contracts" dashboard filter (ignore empty end dates)
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
