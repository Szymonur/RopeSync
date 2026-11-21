# Nagrywanie danych z urządzenia RopeSync (BLE)

Ekran **Urządzenie** nagrywa strumień z ESP32 do lokalnej bazy SQLite (migracja 9: `Sesje_pomiarowe`, `Probki_sesji`, `Zdarzenia_sesji`) i eksportuje każdą sesję do trzech plików.

## Protokół BLE v1

Jedna charakterystyka (`constants/bluetooth.ts`): ESP wysyła NOTIFY, telefon pisze komendy.

Ramka binarna (pierwszy bajt < 0x20), little-endian:

| bajty | pole |
|---|---|
| 0 | typ: `0x01` na żywo, `0x02` synchronizacja |
| 1 | wersja protokołu (`1`) |
| 2 | liczba próbek (1–5) |
| 3 | znacznik sesji (zmienia się przy START/STOP) |
| 4… | próbki po 48 B: `uint32 seq`, `uint32 t_ms`, `float alt_rel, pressure, ax, ay, az, qw, qx, qy, qz, force` |

Pełna ramka ma 244 B, więc potrzebne jest MTU ≥ 247.

Komendy: `START`, `STOP`, `TARE`, `RATE:<Hz>` (10–200), `SYNC`.
Odpowiedzi tekstowe: `ACK:START:<znacznik>:<Hz>:<firmware>`, `ACK:STOP:<znacznik>:<wysłane>:<przepełnienia>`, `ACK:RATE:<Hz>`, `ACK:TARE`, `META:<n>`, `END`.

Parser: `lib/ble/protocol.ts`. Firmware: `Arduino/Server-ble/Server-ble.ino`. Zmiana układu próbki wymaga zmiany w obu miejscach i podbicia wersji protokołu.

## Sesja pomiarowa i zdarzenia

Jeden panel „Sesja pomiarowa”: „Rozpocznij sesję” wysyła `START` do ESP i zaczyna zapis, a przyciski zdarzeń działają tylko w trakcie sesji. „Zakończ sesję” wysyła `STOP` i domyka otwarte przedziały (np. trwający `rest`) w chwili zakończenia.

Zdarzenia: punktowe `start`, `end`, `fall`, `anchor`, `shortRope`, `excessSlack`; przedziałowe `clip` (trwa, dopóki trzymasz przycisk), `block`, `rest` (start/koniec).

## Eksport sesji

Folder `ropesync_<RRRRMMDD-GGMMSS>_<id>`. Oba pliki CSV mają **jedną oś czasu: milisekundy od startu sesji (zegar ESP)**.

**samples.csv** – jeden wiersz na próbkę, posortowane po `seq`:

| kolumna | znaczenie |
|---|---|
| `seq` | numer próbki; luka w numerach = próbka zgubiona w transmisji |
| `t_ms` | ms od startu sesji |
| `alt_rel_m` | wysokość względem startu / TARE [m] |
| `ax_ms2`, `ay_ms2`, `az_ms2` | przyspieszenie w układzie czujnika, z grawitacją [m/s²] |
| `qw`, `qx`, `qy`, `qz` | orientacja (kwaternion jednostkowy) |
| `force_n` | siła z tensometru [N] |

**events.csv**:

| kolumna | znaczenie |
|---|---|
| `label` | rodzaj zdarzenia |
| `t_start_ms` | początek, ms od startu sesji |
| `t_end_ms` | koniec; dla zdarzeń punktowych równy `t_start_ms`; pusty tylko dla przedziału, którego nie dało się domknąć |

Żeby znaleźć dane z czasu zdarzenia, bierzesz wiersze samples.csv z `t_ms` od `t_start_ms` do `t_end_ms`.

**meta.json** – źródło danych (`synthetic` / `sensor`, rozpoznawane po firmware `sim-*`), tryb (`live` / `sync`), godzina startu, częstotliwość, MTU, liczniki zgubionych próbek i duplikatów, jednostki.

W bazie telefonu zostają też dane diagnostyczne, których nie ma w CSV: surowe ciśnienie, czas odbioru każdej ramki BLE i czas telefonu dla zdarzeń.

## Wyrównanie czasu

Zdarzenia są zapisywane w czasie telefonu, a próbki w czasie ESP. Przy eksporcie zdarzenia są przeliczane na oś ESP: przesunięcie między zegarami to najmniejsze (czas odbioru ramki − czas ESP) w sesji, czyli ramka, która doszła najszybciej (kilkadziesiąt ms, mniej niż czas reakcji na przycisk). Dane z synchronizacji (`SYNC`) nie mają wspólnego zegara z telefonem.
