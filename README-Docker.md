# 📋 Contracts App - Aplikacja do Zarządzania Umowami z AI

## 🚀 Szybki Start z Docker

### Wymagania Systemowe

- **Docker Desktop** (Windows/Mac/Linux)
- **Minimum 8GB RAM**
- **Minimum 50GB wolnego miejsca na dysku** (dla MongoDB)

### ⚡ Uruchomienie w 3 krokach

```bash
# 1. Sklonuj repozytorium
git clone <repository-url>
cd contracts-app

# 2. Uruchom aplikację
./scripts/start.sh

# 3. Otwórz w przeglądarce
open http://localhost:3000
```

## 📦 Struktura Aplikacji

### Kontenery Docker

- **App** (Port: 3000) - Aplikacja Next.js
- **MongoDB** (Port: 27017) - Baza danych (50GB wolumen)
- **Redis** (Port: 6379) - Cache (opcjonalny)

### Porty i Konfiguracja

```bash
# Zmień port aplikacji (domyślnie 3000)
echo "APP_PORT=8080" >> .env

# Aplikacja będzie dostępna na:
# http://localhost:8080
```

## 🔧 Konfiguracja

### 1. Zmienne Środowiskowe

Skopiuj `.env.example` do `.env` i skonfiguruj:

```bash
cp .env.example .env
```

**Kluczowe ustawienia:**

```env
# OBOWIĄZKOWE - bez tego AI nie będzie działać!
OPENAI_API_KEY=sk-your-openai-api-key

# Port aplikacji (dla Apache2/Caddy)
APP_PORT=3000

# Bezpieczny secret dla produkcji
NEXTAUTH_SECRET=your-super-secret-key-32-chars-min
```

### 2. Pierwszy Użytkownik

Po uruchomieniu zaloguj się używając:

- **Email:** `admin@example.com`
- **Hasło:** (zostanie wygenerowane automatycznie)

## 🌐 Konfiguracja Proxy (Apache2/Caddy)

### Apache2 Virtual Host

```apache
<VirtualHost *:80>
    ServerName contracts.example.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Dla HTTPS
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
</VirtualHost>
```

### Caddyfile

```caddy
contracts.example.com {
    reverse_proxy localhost:3000
}
```

## 🗄️ Przechowywanie Danych

### Struktura Katalogów

```
./data/
├── mongodb/          # MongoDB data (50GB+)
├── mongodb_config/   # MongoDB config
├── uploads/          # Pliki PDF
└── redis/           # Redis data
```

### Backup Danych

```bash
# Backup MongoDB
docker exec contracts_mongodb mongodump --out /backup

# Backup plików
tar -czf uploads-backup.tar.gz ./data/uploads/
```

## 🛠️ Zarządzanie Aplikacją

### Podstawowe Komendy

```bash
# Uruchomienie
./scripts/start.sh

# Zatrzymanie
./scripts/stop.sh

# Logi
docker-compose logs app
docker-compose logs mongodb

# Restart
docker-compose restart app

# Restart całego stosu
docker-compose restart
```

### Zarządzanie Kontenerami

```bash
# Sprawdzenie statusu
docker-compose ps

# Wejście do kontenera aplikacji
docker exec -it contracts_app sh

# Wejście do MongoDB
docker exec -it contracts_mongodb mongosh

# Sprawdzenie wykorzystania zasobów
docker stats
```

## 🔍 Monitorowanie i Diagnostyka

### Health Checks

```bash
# Sprawdzenie stanu aplikacji
curl http://localhost:3000/api/health

# Sprawdzenie MongoDB
docker exec contracts_mongodb mongosh --eval "db.adminCommand('ping')"

# Sprawdzenie Redis
docker exec contracts_redis redis-cli ping
```

### Logi i Debugowanie

```bash
# Logi w czasie rzeczywistym
docker-compose logs -f app

# Logi tylko błędów
docker-compose logs --tail=100 app | grep ERROR

# Sprawdzenie połączenia z bazą
docker exec contracts_app node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));
"
```

## 🔒 Bezpieczeństwo

### Produkcja - Wymagane Zmiany

```env
# Zmień w produkcji!
NEXTAUTH_SECRET=super-secure-random-string-32-chars
NEXTAUTH_URL=https://your-domain.com

# Użyj silnych haseł dla MongoDB
MONGO_INITDB_ROOT_PASSWORD=very-secure-password

# Konfiguruj LDAP jeśli używasz
LDAP_URL=ldap://your-domain:389
LDAP_BIND_DN=cn=admin,dc=yourdomain,dc=com
```

### Firewall

```bash
# Dla produkcji - zamknij niepotrzebne porty
# MongoDB (27017) - tylko localhost
# Redis (6379) - tylko localhost
# App (3000) - przez reverse proxy
```

## 🧪 Testowanie

### Testy Funkcjonalne

```bash
# Test upload PDF
curl -X POST -F "file=@test.pdf" http://localhost:3000/api/contracts/upload

# Test AI description
curl -X POST http://localhost:3000/api/contracts/ID/generate-description

# Test wyszukiwania
curl "http://localhost:3000/api/search?q=test+contract"
```

### Testy Wydajności

```bash
# Test obciążenia
ab -n 1000 -c 10 http://localhost:3000/

# Sprawdzenie zużycia zasobów
docker stats --no-stream
```

## 🚨 Rozwiązywanie Problemów

### Częste Problemy

#### 1. Aplikacja nie uruchamia się

```bash
# Sprawdź logi
docker-compose logs app

# Sprawdź porty
netstat -tulpn | grep :3000

# Restart aplikacji
docker-compose restart app
```

#### 2. MongoDB problemy

```bash
# Sprawdź połączenie
docker exec contracts_mongodb mongosh --eval "db.adminCommand('ping')"

# Reset MongoDB (UWAGA: usunie dane!)
docker-compose down -v
docker-compose up -d
```

#### 3. Brak miejsca na dysku

```bash
# Sprawdź wykorzystanie dysku
df -h

# Wyczyść Docker
docker system prune -a

# Sprawdź rozmiar volume
docker volume ls
docker system df
```

#### 4. AI nie działa

```bash
# Sprawdź klucz API
echo $OPENAI_API_KEY

# Test OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

## 📊 Optymalizacja Wydajności

### MongoDB

```yaml
# W docker-compose.yml
command: mongod 
  --wiredTigerCacheSizeGB 4
  --wiredTigerCollectionBlockCompressor snappy
  --wiredTigerIndexPrefixCompression true
```

### Redis

```yaml
# Zwiększ pamięć jeśli potrzeba
command: redis-server 
  --maxmemory 1gb 
  --maxmemory-policy allkeys-lru
```

### Aplikacja

```env
# Ustawienia produkcyjne
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 🔄 Aktualizacje

### Aktualizacja Aplikacji

```bash
# Pobierz nowe zmiany
git pull

# Przebuduj i uruchom
docker-compose down
docker-compose up --build -d
```

### Aktualizacja Obrazów

```bash
# Pobierz najnowsze obrazy
docker-compose pull

# Restart z nowymi obrazami
docker-compose up -d
```

## 📞 Wsparcie

### Logi do Debugowania

Zawsze dołączaj logi przy zgłaszaniu problemów:

```bash
# Logi aplikacji
docker-compose logs app > app-logs.txt

# Logi MongoDB
docker-compose logs mongodb > mongodb-logs.txt

# Status kontenerów
docker-compose ps > containers-status.txt
```

### Informacje Systemowe

```bash
# Wersja Docker
docker --version
docker-compose --version

# Wykorzystanie zasobów
docker stats --no-stream

# Informacje o systemie
uname -a
cat /etc/os-release
```

---

## 📋 Checklist Uruchomienia

- [ ] Docker Desktop zainstalowany i uruchomiony
- [ ] Minimum 50GB wolnego miejsca na dysku
- [ ] Skopiowany `.env.example` do `.env`
- [ ] Skonfigurowany `OPENAI_API_KEY`
- [ ] Uruchomione `./scripts/start.sh`
- [ ] Aplikacja dostępna pod `http://localhost:3000`
- [ ] Zalogowanie się jako <admin@example.com>
- [ ] Test upload pliku PDF
- [ ] Test generowania opisu AI
- [ ] Skonfigurowany reverse proxy (Apache2/Caddy) jeśli potrzeba

**🎉 Gotowe! Aplikacja Contracts App z AI i przeglądarką PDF jest gotowa do użycia!**
