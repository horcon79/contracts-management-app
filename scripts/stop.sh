#!/bin/bash

# =============================================================================
# Skrypt zatrzymywania aplikacji Contracts App
# =============================================================================

echo "🛑 ZATRZYMYWANIE APLIKACJI CONTRACTS APP"
echo "========================================"

# Zatrzymywanie kontenerów
if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    docker compose down
fi

echo "✅ Aplikacja została zatrzymana"
echo "💾 Dane zostały zachowane w katalogach ./data/"
echo ""
echo "🔄 Aby ponownie uruchomić: ./scripts/start.sh"
echo "🗑️  Aby usunąć dane: docker volume prune (UWAGA: usunie wszystkie dane!)"
