export const DATABASE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Rejony (
    id_rejonu INTEGER PRIMARY KEY AUTOINCREMENT,
    nazwa_rejonu TEXT NOT NULL UNIQUE,
	szerokosc_geograficzna REAL NOT NULL CHECK (szerokosc_geograficzna BETWEEN -90 AND 90),
	dlugosc_geograficzna REAL NOT NULL CHECK (dlugosc_geograficzna BETWEEN -180 AND 180),
    kraj TEXT
);

CREATE TABLE IF NOT EXISTS Sektory (
    id_sektoru INTEGER PRIMARY KEY AUTOINCREMENT,
    nazwa_sektoru TEXT NOT NULL,
    id_rejonu INTEGER NOT NULL,
	szerokosc_geograficzna REAL NOT NULL CHECK (szerokosc_geograficzna BETWEEN -90 AND 90),
	dlugosc_geograficzna REAL NOT NULL CHECK (dlugosc_geograficzna BETWEEN -180 AND 180),
    UNIQUE (nazwa_sektoru, id_rejonu),
    FOREIGN KEY (id_rejonu) REFERENCES Rejony(id_rejonu) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Typy_skaly (
    materia TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS Skaly (
    id_skaly INTEGER PRIMARY KEY AUTOINCREMENT,
    id_sektoru INTEGER NOT NULL,
    nazwa_skaly TEXT NOT NULL,
	szerokosc_geograficzna REAL NOT NULL CHECK (szerokosc_geograficzna BETWEEN -90 AND 90),
	dlugosc_geograficzna REAL NOT NULL CHECK (dlugosc_geograficzna BETWEEN -180 AND 180),
    czy_zakaz INTEGER NOT NULL CHECK (czy_zakaz IN (0, 1)),
    opiekun TEXT,
    materia TEXT NOT NULL,
    UNIQUE (nazwa_skaly, id_sektoru),
    FOREIGN KEY (id_sektoru) REFERENCES Sektory(id_sektoru) ON DELETE CASCADE,
    FOREIGN KEY (materia) REFERENCES Typy_skaly(materia) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Skale_linowe (
    francuska TEXT PRIMARY KEY,
    kurtyki TEXT NOT NULL,
    yds TEXT NOT NULL,
    przymiotnikowa TEXT NOT NULL,
	CHECK (francuska = LOWER(francuska))
);

CREATE TABLE IF NOT EXISTS Skale_boulderowe (
    font TEXT PRIMARY KEY,
    hueco TEXT NOT NULL,
    krakowska_boulderowa TEXT NOT NULL
	CHECK (font = LOWER(font))
);

CREATE TABLE IF NOT EXISTS Drogi (
    id_drogi TEXT PRIMARY KEY,
    typ_drogi TEXT NOT NULL CHECK (typ_drogi IN ('sportowa', 'trad', 'boulder')),
    nazwa_drogi TEXT NOT NULL,
    id_skaly INTEGER NOT NULL,  
    data_utworzenia TEXT,
    opis TEXT,
    UNIQUE (nazwa_drogi, id_skaly),
    FOREIGN KEY (id_skaly) REFERENCES Skaly(id_skaly) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Drogi_sportowe_szczegoly (
    id_drogi TEXT PRIMARY KEY,
    dlugosc_drogi INTEGER NOT NULL,
    liczba_ringow INTEGER NOT NULL,
    stanowisko TEXT,
    skala_linowa TEXT NOT NULL,
    FOREIGN KEY (id_drogi) REFERENCES Drogi(id_drogi) ON DELETE CASCADE,
    FOREIGN KEY (skala_linowa) REFERENCES Skale_linowe(francuska) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Trady_szczegoly (
    id_drogi TEXT PRIMARY KEY,
    dlugosc_drogi INTEGER NOT NULL,
    czy_stanowiska INTEGER NOT NULL CHECK (czy_stanowiska IN (0, 1)),
    potrzebny_sprzet TEXT NOT NULL,
    skala_linowa TEXT NOT NULL,
    FOREIGN KEY (id_drogi) REFERENCES Drogi(id_drogi) ON DELETE CASCADE,
    FOREIGN KEY (skala_linowa) REFERENCES Skale_linowe(francuska) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Bouldery_szczegoly (
    id_drogi TEXT PRIMARY KEY,
    wysokosc REAL NOT NULL,
    liczba_potrzebnych_crashpadow INTEGER,
    skala_boulderowa TEXT NOT NULL,
    FOREIGN KEY (id_drogi) REFERENCES Drogi(id_drogi) ON DELETE CASCADE,
    FOREIGN KEY (skala_boulderowa) REFERENCES Skale_boulderowe(font) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Uzytkownicy (
    id_uzytkownika INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    imie TEXT NOT NULL,
    nazwisko TEXT NOT NULL,
	CHECK (
        email LIKE '%_@_%._%' AND 
        LENGTH(email) - LENGTH(REPLACE(email, '@', '')) = 1
    )
);

CREATE TABLE IF NOT EXISTS Style_przejscia (
    nazwa_stylu TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS Przejscia (
    id_przejscia TEXT PRIMARY KEY,
    data TEXT DEFAULT CURRENT_DATE,
    timeline_data TEXT,
    notatka TEXT,
    id_uzytkownika INTEGER NOT NULL,
    nazwa_stylu TEXT NOT NULL,
    id_drogi TEXT NOT NULL,
    synced INTEGER DEFAULT 1,
    deleted INTEGER DEFAULT 0,
    FOREIGN KEY (id_uzytkownika) REFERENCES Uzytkownicy(id_uzytkownika) ON DELETE CASCADE,
    FOREIGN KEY (nazwa_stylu) REFERENCES Style_przejscia(nazwa_stylu) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_drogi) REFERENCES Drogi(id_drogi) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Pomiary_wyciagow (
    id_sesji TEXT PRIMARY KEY,
    id_urzadzenia TEXT,
    start_pomiaru TEXT NOT NULL,
    koniec_pomiaru TEXT NOT NULL,
    max_wysokosc REAL NOT NULL,
    min_wysokosc REAL NOT NULL,
    max_sila REAL NOT NULL,
    id_przejscia TEXT NOT NULL,
	CHECK (koniec_pomiaru >= start_pomiaru),
	CHECK (max_wysokosc >= min_wysokosc),
    FOREIGN KEY (id_przejscia) REFERENCES Przejscia(id_przejscia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Reakcje (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_uzytkownika INTEGER NOT NULL,
    id_przejscia TEXT NOT NULL,
    imie TEXT,
    nazwisko TEXT,
    username TEXT,
    data_reakcji TEXT,
    wyswietlono INTEGER DEFAULT 0,
    UNIQUE(id_uzytkownika, id_przejscia),
    FOREIGN KEY (id_przejscia) REFERENCES Przejscia(id_przejscia) ON DELETE CASCADE
);
`;

export const SEED_DATA = `
-- 1. SŁOWNIKI: Typy skał, Style przejścia, Skale linowe, Skale boulderowe
INSERT OR IGNORE INTO Typy_skaly (materia) VALUES 
('Wapień'), 
('Granit'), 
('Piaskowiec');

INSERT OR IGNORE INTO Style_przejscia (nazwa_stylu) VALUES 
('OS'), ('Flash'), ('RP'), ('AF'), ('TR');

INSERT OR IGNORE INTO Skale_linowe (francuska, kurtyki, yds, przymiotnikowa) VALUES 
('5a', 'V', '5.7', 'Trudna'),
('5c', 'VI', '5.9', 'Bardzo Trudna'),
('6a', 'VI+', '5.10a', 'Niezwykle Trudna'),
('6a+', 'VI.1', '5.10c', 'Skrajnie Trudna'),
('6b', 'VI.1+', '5.10d', 'Skrajnie Trudna'),
('6c', 'VI.2', '5.11b', 'Skrajnie Trudna'),
('7a', 'VI.2+', '5.11d', 'Skrajnie Trudna'),
('7b', 'VI.3', '5.12b', 'Skrajnie Trudna'),
('7c', 'VI.4', '5.12d', 'Skrajnie Trudna'),
('8a', 'VI.5', '5.13b', 'Skrajnie Trudna'),
('9a', 'VI.7', '5.14d', 'Ekstremalna');

INSERT OR IGNORE INTO Skale_boulderowe (font, hueco, krakowska_boulderowa) VALUES 
('5', 'V1', 'V'),
('6a', 'V3', 'VI.1'),
('6b', 'V4', 'VI.2'),
('6c', 'V5', 'VI.3'),
('7a', 'V6', 'VI.4'),
('7c', 'V9', 'VI.5'),
('8a', 'V11', 'VI.6');

-- 2. REJONY
-- Współrzędne uśrednione dla całego rejonu geograficznego
INSERT OR IGNORE INTO Rejony (id_rejonu, nazwa_rejonu, kraj, szerokosc_geograficzna, dlugosc_geograficzna) VALUES 
(1, 'Jura Południowa', 'Polska', 50.1500, 19.7500),
(2, 'Jura Północna', 'Polska', 50.5700, 19.5300),
(3, 'Sokoliki', 'Polska', 50.8700, 15.8600),
(4, 'Tatry Wysokie', 'Polska', 49.2000, 20.0500),
(5, 'Pogórze Rożnowskie', 'Polska', 49.7800, 20.9600);

-- 3. SEKTORY
-- Współrzędne wskazujące na środek danej doliny / zgrupowania skał
INSERT OR IGNORE INTO Sektory (id_sektoru, nazwa_sektoru, id_rejonu, szerokosc_geograficzna, dlugosc_geograficzna) VALUES 
(1, 'Dolina Będkowska', 1, 50.1690, 19.7440),
(2, 'Góra Zborów', 2, 50.5750, 19.5280),
(3, 'Sokolik Duży', 3, 50.8710, 15.8680),
(4, 'Dolina Rybiego Potoku', 4, 49.2010, 20.0710),
(5, 'Rezerwat Ciężkowice', 5, 49.7840, 20.9630);

-- 4. SKAŁY
INSERT OR IGNORE INTO Skaly (id_skaly, id_sektoru, nazwa_skaly, szerokosc_geograficzna, dlugosc_geograficzna, czy_zakaz, opiekun, materia) VALUES 
(1, 1, 'Sokolica', 50.1682, 19.7431, 0, 'Nasze Skały', 'Wapień'),
(2, 1, 'Dupa Słonia', 50.1711, 19.7455, 0, 'Nasze Skały', 'Wapień'),
(3, 2, 'Młynarz', 50.5753, 19.5312, 0, NULL, 'Wapień'),
(4, 3, 'Krzywa Turnia', 50.8715, 15.8671, 0, 'Dolnośląski Związek Alpinizmu', 'Granit'),
(5, 3, 'Sukiennice', 50.8702, 15.8690, 0, NULL, 'Granit'),
(6, 4, 'Mnich', 49.1963, 20.0531, 0, 'TPN', 'Granit'),
(7, 5, 'Ratusz', 49.7845, 20.9632, 0, NULL, 'Piaskowiec');

-- 5. DROGI WSPINACZKOWE
INSERT OR IGNORE INTO Drogi (id_drogi, typ_drogi, nazwa_drogi, id_skaly, data_utworzenia, opis) VALUES 
-- Jura: Sportowe
('d_s1', 'sportowa', 'Będkowski Playboy', 1, '1994-05-01', 'Absolutny klasyk na Sokolicy. Ciągowe wspinanie w lekkim przewieszeniu.'),
('d_s2', 'sportowa', 'Lewy Filar', 2, '1985-06-12', 'Piekna, estetyczna linia. Techniczna rysa i płyta.'),
('d_s3', 'sportowa', 'Chomeini', 2, '1990-08-01', 'Twardy crux na starcie, wyżej wytrzymałościowo.'),
-- Sokoliki: Trad & Sport
('d_t1', 'trad', 'Rysa Kurtyki', 4, '1970-04-10', 'Jeden z najpiękniejszych tradów w Polsce. Piękna, ciągowa rysa.'),
('d_s4', 'sportowa', 'Krew i Pot', 5, '1995-09-10', 'Wymagające techniczne wspinanie po krawądkach.'),
-- Tatry: Trad
('d_t2', 'trad', 'Droga Robakiewicza', 6, '1954-07-20', 'Najpopularniejszy klasyk na Wschodniej Ścianie Mnicha.'),
('d_t3', 'trad', 'Międzymiastowa', 6, '1980-08-15', 'Wielowyciągowy klasyk o litym granicie.'),
-- Ciężkowice: Bouldery
('d_b1', 'boulder', 'Krew z Nosa', 7, '2005-05-05', 'Bardzo zginający start i dynamiczne wyjście.'),
('d_b2', 'boulder', 'Czysta Formalność', 7, '2010-09-12', 'Techniczny pion po słabych dziurkach.');

-- 6. SZCZEGÓŁY DRÓG
INSERT OR IGNORE INTO Drogi_sportowe_szczegoly (id_drogi, dlugosc_drogi, liczba_ringow, stanowisko, skala_linowa) VALUES 
('d_s1', 25, 11, 'Ring zjazdowy (RZ)', '7c'),
('d_s2', 18, 7, 'Dwa ringi z łańcuchem', '6b'),
('d_s3', 20, 8, 'Dwa ringi z łańcuchem', '7b'),
('d_s4', 15, 6, 'Łańcuch zjazdowy', '6c');

INSERT OR IGNORE INTO Trady_szczegoly (id_drogi, dlugosc_drogi, czy_stanowiska, potrzebny_sprzet, skala_linowa) VALUES 
('d_t1', 20, 1, 'Standardowy set kości, friendy #0.3 do #3', '6a+'),
('d_t2', 140, 1, 'Set friendów (podwójne średnie), kości, taśmy', '5c'),
('d_t3', 150, 1, 'Set friendów, set kości', '6a+');

INSERT OR IGNORE INTO Bouldery_szczegoly (id_drogi, wysokosc, liczba_potrzebnych_crashpadow, skala_boulderowa) VALUES 
('d_b1', 4.5, 3, '7a'),
('d_b2', 3.8, 2, '6c');

-- 7. UŻYTKOWNICY
INSERT OR IGNORE INTO Uzytkownicy (id_uzytkownika, login, email, imie, nazwisko) VALUES 
(1, 'wspinacz_zawodowy', 'zawodowy@wspin.pl', 'Maciej', 'Kowalski'),
(2, 'taterniczka', 'ania.tatry@gory.com', 'Anna', 'Nowak'),
(3, 'boulder_boy', 'crusher@szkola.edu.pl', 'Jan', 'Wiśniewski');

-- 8. PRZEJŚCIA
INSERT OR IGNORE INTO Przejscia (id_przejscia, data, timeline_data, notatka, id_uzytkownika, nazwa_stylu, id_drogi) VALUES 
('przejscie_1', '2024-05-01', '{"date":"2024-05-01","timeline":[]}', 'Poszło gładko w 2 próbie. Mega warun!', 1, 'RP', 'd_s1'),
('przejscie_2', '2024-05-15', NULL, 'Klasyk na rozgrzewkę. Trochę wyślizgane startowe chwyty.', 1, 'OS', 'd_s2'),
('przejscie_3', '2023-08-10', '{"date":"2023-08-10","timeline":[]}', 'Piękna przygoda, pogodę mieliśmy idealną. Start o 6 rano.', 2, 'OS', 'd_t2'),
('przejscie_4', '2023-10-22', NULL, 'Rozdarty palec, ale padło rzutem na taśmę.', 3, 'RP', 'd_b1'),
('przejscie_5', '2024-04-12', NULL, 'Bałem się wyjścia nad cama, ale dało radę.', 1, 'Flash', 'd_t1');

-- 9. POMIARY (Dane z urządzeń telemetrycznych/smartwatchy)
INSERT OR IGNORE INTO Pomiary_wyciagow (id_sesji, id_urzadzenia, start_pomiaru, koniec_pomiaru, max_wysokosc, min_wysokosc, max_sila, id_przejscia) VALUES 
('sesja_1', 'garmin_fenix_7_A1', '2024-05-01T10:15:00Z', '2024-05-01T10:28:45Z', 425.5, 400.0, 112.5, 'przejscie_1'),
('sesja_2', 'apple_watch_ultra', '2023-08-10T08:00:00Z', '2023-08-10T11:45:00Z', 2068.0, 1918.0, 85.2, 'przejscie_3'),
('sesja_3', 'beast_sensor_v2', '2023-10-22T14:30:00Z', '2023-10-22T14:31:15Z', 324.5, 320.0, 450.8, 'przejscie_4');
`;
