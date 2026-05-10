export const DATABASE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Rejony (
    id_rejonu INTEGER PRIMARY KEY AUTOINCREMENT,
    nazwa_rejonu TEXT NOT NULL UNIQUE,
    kraj TEXT
);

CREATE TABLE IF NOT EXISTS Sektory (
    id_sektoru INTEGER PRIMARY KEY AUTOINCREMENT,
    nazwa_sektoru TEXT NOT NULL,
    id_rejonu INTEGER NOT NULL,
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
    uri_timeline TEXT,
    notatka TEXT,
    id_uzytkownika INTEGER NOT NULL,
    nazwa_stylu TEXT NOT NULL,
    id_drogi TEXT NOT NULL,
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
`;

export const SEED_DATA = `
INSERT OR IGNORE INTO Typy_skaly (materia) VALUES ('Wapień'), ('Granit'), ('Piaskowiec');
INSERT OR IGNORE INTO Style_przejscia (nazwa_stylu) VALUES ('OS'), ('Flash'), ('RP'), ('AF'), ('TR');

-- Dane testowe dla struktury wspinaczkowej
INSERT OR IGNORE INTO Rejony (id_rejonu, nazwa_rejonu, kraj) VALUES (1, 'Jura Krakowsko-Częstochowska', 'Polska');
INSERT OR IGNORE INTO Sektory (id_sektoru, nazwa_sektoru, id_rejonu) VALUES (1, 'Dolina Kluczwody', 1);
INSERT OR IGNORE INTO Skaly (id_skaly, id_sektoru, nazwa_skaly, szerokosc_geograficzna, dlugosc_geograficzna, czy_zakaz, materia) 
VALUES (1, 1, 'Zamaniowa', 50.15, 19.82, 0, 'Wapień');

-- Ta droga będzie naszym celem testowym
INSERT OR IGNORE INTO Drogi (id_drogi, typ_drogi, nazwa_drogi, id_skaly) 
VALUES ('droga_123', 'sportowa', 'Prostowanie Filara', 1);
`;
