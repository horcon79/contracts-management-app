#!/bin/bash

# =============================================================================
# Skrypt uruchamiania aplikacji Contracts App z Docker
# =============================================================================

set -e  # Exit on any error

echo "🚀 URUCHAMIANIE APLIKACJI CONTRACTS APP"
echo "======================================"

# Sprawdzenie czy Docker jest zainstalowany
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nie jest zainstalowany!"
    echo "📥 Pobierz i zainstaluj Docker: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Sprawdzenie czy Docker Compose jest zainstalowany
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose nie jest zainstalowany!"
    echo "📥 Docker Compose jest częścią Docker Desktop"
    exit 1
fi

# Sprawdzenie czy plik .env istnieje
if [ ! -f .env ]; then
    echo "⚠️  Plik .env nie istnieje!"
    echo "📋 Kopiuję .env.example do .env..."
    cp .env.example .env
    echo "✅ Utworzono plik .env z domyślnymi ustawieniami"
    echo "🔧 Pamiętaj o skonfigurowaniu OPENAI_API_KEY w pliku .env"
fi

# Tworzenie katalogów dla danych jeśli nie istnieją
echo "📁 Tworzenie katalogów dla danych..."
mkdir -p data/mongodb data/mongodb_config data/uploads data/redis

# Nadawanie odpowiednich uprawnień
chmod 755 data/mongodb data/mongodb_config data/uploads data/redis

echo "📦 Budowanie i uruchamianie kontenerów..."
echo "⏳ To może potrwać kilka minut przy pierwszym uruchomieniu..."

# Budowanie i uruchamianie
if command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
else
    docker compose up --build -d
fi

echo ""
echo "⏳ Oczekiwanie na uruchomienie usług..."

# Oczekiwanie na MongoDB
echo "🔄 Sprawdzanie stanu MongoDB..."
for i in {1..30}; do
    if docker exec contracts_mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        echo "✅ MongoDB jest gotowy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ MongoDB nie uruchomił się w oczekiwanym czasie"
        exit 1
    fi
    echo "⏳ Czekam na MongoDB... ($i/30)"
    sleep 2
done

# Oczekiwanie na aplikację
echo "🔄 Sprawdzanie stanu aplikacji..."
for i in {1..20}; do
    if curl -f http://localhost:${APP_PORT:-3000}/api/health &> /dev/null; then
        echo "✅ Aplikacja jest gotowa!"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "⚠️  Aplikacja może potrzebować więcej czasu na uruchomienie"
        break
    fi
    echo "⏳ Czekam na aplikację... ($i/20)"
    sleep 3
done

echo ""
echo "🎉 APLIKACJA ZOSTAŁA POMYŚLNIE URUCHOMIONA!"
echo "============================================"
echo ""
echo "📍 URL aplikacji: http://localhost:${APP_PORT:-3000}"
echo "🗄️  MongoDB: localhost:27017"
echo "📊 Redis: localhost:6379"
echo ""
echo "🔑 Dane logowania:"
echo "   Email: admin@example.com"
echo "   Hasło: (ustaw w bazie danych lub przez interfejs)"
echo ""
echo "📁 Pliki przechowywane w: ./data/uploads/"
echo "🗃️  Dane MongoDB w: ./data/mongodb/"
echo ""
echo "🛠️  Przydatne komendy:"
echo "   docker-compose logs app       - logi aplikacji"
echo "   docker-compose logs mongodb   - logi bazy danych"
echo "   docker-compose down           - zatrzymanie usług"
echo "   docker-compose restart app    - restart aplikacji"
echo ""
echo "📚 Dokumentacja: ./README.md"
