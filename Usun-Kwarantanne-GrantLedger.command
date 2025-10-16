#!/bin/bash

# Skrypt do usunięcia kwarantanny z GrantLedger.app
# Wystarczy dwukrotnie kliknąć ten plik

clear
echo "════════════════════════════════════════════════════════════"
echo "   Usuwanie kwarantanny z GrantLedger.app"
echo "════════════════════════════════════════════════════════════"
echo ""

# Sprawdź możliwe lokalizacje
LOCATIONS=(
    "$HOME/Downloads/GrantLedger.app"
    "$HOME/Desktop/GrantLedger.app"
    "/Applications/GrantLedger.app"
)

FOUND=0

for location in "${LOCATIONS[@]}"; do
    if [ -d "$location" ]; then
        echo "✓ Znaleziono: $location"
        echo ""
        echo "Usuwam kwarantannę..."
        xattr -cr "$location"
        
        if [ $? -eq 0 ]; then
            echo "✅ SUKCES! Kwarantanna została usunięta."
            echo ""
            echo "Możesz teraz otworzyć GrantLedger normalnie."
            FOUND=1
        else
            echo "❌ Błąd podczas usuwania kwarantanny."
            echo "Spróbuj ręcznie w Terminalu:"
            echo "xattr -cr \"$location\""
        fi
        echo ""
        break
    fi
done

if [ $FOUND -eq 0 ]; then
    echo "❌ Nie znaleziono GrantLedger.app w standardowych lokalizacjach:"
    echo "   • ~/Downloads/"
    echo "   • ~/Desktop/"
    echo "   • /Applications/"
    echo ""
    echo "📁 Ręczne rozwiązanie:"
    echo ""
    echo "1. Otwórz Terminal (Applications → Utilities → Terminal)"
    echo "2. Wpisz: xattr -cr "
    echo "3. Przeciągnij GrantLedger.app do okna Terminala"
    echo "4. Naciśnij Enter"
    echo ""
fi

echo "════════════════════════════════════════════════════════════"
echo "Naciśnij dowolny klawisz, aby zamknąć..."
read -n 1 -s
