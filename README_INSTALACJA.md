# Instalacja GrantLedger na macOS

## Problem: "Aplikacja jest uszkodzona i nie można jej otworzyć"

To standardowy komunikat bezpieczeństwa macOS dla aplikacji pobranych spoza Mac App Store.

### ✅ ROZWIĄZANIE 1: Skrypt automatyczny (NAJŁATWIEJSZE)

1. **Pobierz** plik `Usun-Kwarantanne-GrantLedger.command` z tego samego miejsca co GrantLedger
2. **Kliknij dwukrotnie** na ten plik
3. Skrypt automatycznie znajdzie i usunie kwarantannę
4. Gotowe! Teraz możesz otworzyć GrantLedger

---

### ✅ ROZWIĄZANIE 2: Terminal (dla zaawansowanych)

1. Otwórz **Terminal** (Applications → Utilities → Terminal)
2. Wklej tę komendę i naciśnij Enter:

```bash
xattr -cr ~/Downloads/GrantLedger.app
```

3. Jeśli aplikacja jest w innym miejscu, zastąp ścieżkę, np.:

```bash
xattr -cr ~/Desktop/GrantLedger.app
```

4. Teraz **przeciągnij aplikację do folderu Applications** i otwórz normalnie

---

### Alternatywa: Otwórz przez menu kontekstowe

1. Znajdź **GrantLedger.app** w Finderze
2. **Przytrzymaj Control + kliknij** na aplikację
3. Wybierz **"Otwórz"** z menu
4. Pojawi się ostrzeżenie **z dodatkowym przyciskiem "Otwórz"**
5. Kliknij **"Otwórz"**

**Jeśli nie widzisz opcji "Otwórz":**

- Spróbuj **Option + Control + kliknij**
- Lub użyj rozwiązania z Terminalem powyżej

---

### Jeśli aplikacja już jest w Applications

```bash
xattr -cr /Applications/GrantLedger.app
```

Następnie uruchom aplikację normalnie z Launchpad lub Applications.

---

## Dlaczego to się dzieje?

macOS Gatekeeper blokuje aplikacje, które nie zostały:

- Podpisane przez zarejestrowanego Apple Developera
- Znotaryzowane przez Apple

GrantLedger jest bezpieczną aplikacją open-source, ale wymaga jednorazowego usunięcia flagi kwarantanny.

---

## Instalacja na Windows

Windows może pokazać **"Windows protected your PC"**:

1. Kliknij **"More info"**
2. Kliknij **"Run anyway"**

Aplikacja zostanie zainstalowana normalnie.
