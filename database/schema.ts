export const DATABASE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Rejony (
    id_rejonu INTEGER PRIMARY KEY AUTOINCREMENT,
    nazwa_rejonu TEXT NOT NULL UNIQUE,
    kraj TEXT,
    szerokosc_geograficzna REAL CHECK (szerokosc_geograficzna BETWEEN -90 AND 90),
    dlugosc_geograficzna REAL CHECK (dlugosc_geograficzna BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS Sektory (
    id_sektoru INTEGER PRIMARY KEY AUTOINCREMENT,
    nazwa_sektoru TEXT NOT NULL,
    id_rejonu INTEGER NOT NULL,
    szerokosc_geograficzna REAL CHECK (szerokosc_geograficzna BETWEEN -90 AND 90),
    dlugosc_geograficzna REAL CHECK (dlugosc_geograficzna BETWEEN -180 AND 180),
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
    szerokosc_geograficzna REAL CHECK (szerokosc_geograficzna BETWEEN -90 AND 90),
    dlugosc_geograficzna REAL CHECK (dlugosc_geograficzna BETWEEN -180 AND 180),
    materia TEXT,
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
    krakowska_boulderowa TEXT NOT NULL,
    CHECK (font = LOWER(font))
);

CREATE TABLE IF NOT EXISTS Drogi (
    id_drogi TEXT PRIMARY KEY,
    typ_drogi TEXT NOT NULL CHECK (typ_drogi IN ('Sport', 'Mixed trad', 'Trad', 'Boulder')),
    nazwa_drogi TEXT NOT NULL,
    id_skaly INTEGER NOT NULL,  
    data_utworzenia TEXT DEFAULT CURRENT_DATE,
    opis TEXT,
    UNIQUE (nazwa_drogi, id_skaly),
    FOREIGN KEY (id_skaly) REFERENCES Skaly(id_skaly) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Drogi_sportowe_szczegoly (
    id_drogi TEXT PRIMARY KEY,
    dlugosc_drogi INTEGER,
    liczba_ringow INTEGER,
    stanowisko TEXT,
    skala_linowa TEXT NOT NULL,
    FOREIGN KEY (id_drogi) REFERENCES Drogi(id_drogi) ON DELETE CASCADE,
    FOREIGN KEY (skala_linowa) REFERENCES Skale_linowe(francuska) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Trady_szczegoly (
    id_drogi TEXT PRIMARY KEY,
    dlugosc_drogi INTEGER,
    czy_stanowiska INTEGER NOT NULL DEFAULT 0 CHECK (czy_stanowiska IN (0, 1)),
    potrzebny_sprzet TEXT,
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
    id_uzytkownika INTEGER PRIMARY KEY,
    login TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    haslo TEXT NOT NULL, 
    sol TEXT NOT NULL,
    imie TEXT NOT NULL,
    nazwisko TEXT NOT NULL,
    CHECK (
        email LIKE '%_@_%._%' AND 
        LENGTH(email) - LENGTH(REPLACE(email, '@', '')) = 1
    )
);

CREATE TABLE IF NOT EXISTS Obserwacje (
    id_obserwujacego INTEGER NOT NULL,
    id_obserwowanego INTEGER NOT NULL,
    data_rozpoczecia TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_obserwujacego, id_obserwowanego),
    FOREIGN KEY (id_obserwujacego) REFERENCES Uzytkownicy(id_uzytkownika) ON DELETE CASCADE,
    FOREIGN KEY (id_obserwowanego) REFERENCES Uzytkownicy(id_uzytkownika) ON DELETE CASCADE,
    CHECK (id_obserwujacego <> id_obserwowanego)
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
    -- Flagi do synchronizacji z API
    synced INTEGER DEFAULT 1,
    deleted INTEGER DEFAULT 0,
    FOREIGN KEY (id_uzytkownika) REFERENCES Uzytkownicy(id_uzytkownika) ON DELETE CASCADE,
    FOREIGN KEY (nazwa_stylu) REFERENCES Style_przejscia(nazwa_stylu) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_drogi) REFERENCES Drogi(id_drogi) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Reakcje (
    id_uzytkownika INTEGER NOT NULL,
    id_przejscia TEXT NOT NULL,
    wyswietlono INTEGER DEFAULT 0,
    utworzono TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_uzytkownika, id_przejscia),
    FOREIGN KEY (id_uzytkownika) REFERENCES Uzytkownicy(id_uzytkownika) ON DELETE CASCADE,
    FOREIGN KEY (id_przejscia) REFERENCES Przejscia(id_przejscia) ON DELETE CASCADE
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

export const SEED_DATA = ``; // Zgodnie z umową, zostawiamy na razie puste, do synchronizacji z API.