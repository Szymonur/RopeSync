# 🧗‍♂️ RopeSync - Mobile & Web App

RopeSync to innowacyjna platforma dla wspinaczy, łącząca funkcjonalności dziennika przejść ze społecznościowym śledzeniem aktywności. Aplikacja pozwala na wyszukiwanie dróg, ręczne rejestrowanie przejść oraz śledzenie statystyk. 

Docelowo aplikacja integruje się z dedykowanym urządzeniem pomiarowym (opartym o ESP32) noszonym przez wspinacza, wizualizując przebieg wspinaczki za pomocą innowacyjnego **Heightline'u** (osi zdarzeń opartej na wysokości), na którym rejestrowane są wpinki, loty i ich parametry.

## ✨ Funkcjonalności

### 👤 Konto i Społeczność
* **Autoryzacja JWT:** Bezpieczne logowanie i utrzymywanie sesji dzięki wbudowanemu szyfrowaniu danych (Expo Secure Store).
* **Zarządzanie kontem:** Rejestracja, logowanie oraz resetowanie hasła.
* **Profil i statystyki:** Przegląd własnych osiągnięć wspinaczkowych.
* **Społeczność:** Obserwowanie innych wspinaczy oraz feed z ich przejściami.

### 🧗‍♀️ Rejestrowanie i Baza Dróg
* **Baza i Mapy:** Wyszukiwanie regionów, sektorów i konkretnych dróg wspinaczkowych z wykorzystaniem interaktywnych map.
* **Manualny logbook:** Ręczne dodawanie własnych przejść wraz ze szczegółami.
* **Tryb Offline:** Wsparcie lokalnej bazy danych SQLite.

### 📡 Integracja Sprzętowa (Hardware)
* **Bluetooth Low Energy (BLE):** Bezpośrednia komunikacja z modułem ESP32.
* **Heightline (Oś Wysokości):** Unikalna wizualizacja przejścia rysowana dynamicznie na podstawie danych telemetrycznych (wykresy SVG). *Obecnie wspiera dane wygenerowane sztucznie.*
* **Wzbogacanie danych:** Możliwość dodania nazwy drogi, opisu i zapisania zarejestrowanego przez urządzenie śladu do swojego profilu.

## 🛠 Technologie

* **Framework:** React Native / Expo 
* **Język:** TypeScript
* **Zarządzanie zapytaniami API:** TanStack React Query + Axios
* **Baza lokalna i Storage:** Expo SQLite, Expo Secure Store
* **Komunikacja BLE:** react-native-ble-plx
* **Mapy i Grafika:** React Native Maps, React Native SVG
* **Ikony i UI:** @expo/vector-icons, react-native-ui-datepicker

## 🚀 Uruchomienie projektu

### Wymagania wstępne
* Środowisko Node.js
* Aplikacja Expo Go na fizycznym telefonie (wymagane do testów BLE) lub odpowiednie emulatory Android/iOS.
