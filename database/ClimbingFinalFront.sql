PRAGMA foreign_keys = ON;

CREATE TABLE Rejony (
    nazwa_rejonu TEXT PRIMARY KEY,
    kraj TEXT
);

CREATE TABLE Sektory (
    nazwa_sektoru TEXT NOT NULL,
    nazwa_rejonu TEXT NOT NULL,
    PRIMARY KEY (nazwa_sektoru, nazwa_rejonu),
    FOREIGN KEY (nazwa_rejonu) REFERENCES Rejony(nazwa_rejonu) ON DELETE CASCADE
);

CREATE TABLE Typy_skaly (
    materia TEXT PRIMARY KEY
);

CREATE TABLE Skaly (
    nazwa_skaly TEXT NOT NULL,
    nazwa_sektoru TEXT NOT NULL,
    nazwa_rejonu TEXT NOT NULL,
    szerokosc_geograficzna REAL NOT NULL,
    dlugosc_geograficzna REAL NOT NULL,
    czy_zakaz INTEGER NOT NULL CHECK (czy_zakaz IN (0, 1)),
    opiekun TEXT,
    materia TEXT NOT NULL,
    PRIMARY KEY (nazwa_skaly, nazwa_sektoru, nazwa_rejonu),
    FOREIGN KEY (nazwa_sektoru, nazwa_rejonu) REFERENCES Sektory(nazwa_sektoru, nazwa_rejonu) ON DELETE CASCADE,
    FOREIGN KEY (materia) REFERENCES Typy_skaly(materia)
);

CREATE TABLE Skale_linowe (
    francuska TEXT PRIMARY KEY,
    kurtyki TEXT NOT NULL,
    yds TEXT NOT NULL,
    przymiotnikowa TEXT NOT NULL
);

CREATE TABLE Skale_boulderowe (
    font TEXT PRIMARY KEY,
    hueco TEXT NOT NULL,
    krakowska_boulderowa TEXT NOT NULL
);

CREATE TABLE Drogi_sportowe (
    id_drogi_sportowej INTEGER PRIMARY KEY AUTOINCREMENT,

    nazwa_drogi TEXT NOT NULL,
    nazwa_skaly TEXT NOT NULL,
    nazwa_sektoru TEXT NOT NULL,
    nazwa_rejonu TEXT NOT NULL,
    data_utworzenia TEXT NOT NULL,
    opis TEXT,

    dlugosc_drogi INTEGER NOT NULL,
    liczba_ringow INTEGER NOT NULL,
    stanowisko TEXT,

    skala_linowa TEXT NOT NULL,
    FOREIGN KEY (nazwa_skaly, nazwa_sektoru, nazwa_rejonu) REFERENCES Skaly(nazwa_skaly, nazwa_sektoru, nazwa_rejonu) ON DELETE CASCADE,
    FOREIGN KEY (skala_linowa) REFERENCES Skale_linowe(francuska)
);

CREATE TABLE Trady (
    id_tradu INTEGER PRIMARY KEY AUTOINCREMENT,

    nazwa_drogi TEXT NOT NULL,
    nazwa_skaly TEXT NOT NULL,
    nazwa_sektoru TEXT NOT NULL,
    nazwa_rejonu TEXT NOT NULL,
    data_utworzenia TEXT NOT NULL,
    opis TEXT,

    czy_stanowiska INTEGER NOT NULL CHECK (czy_stanowiska IN (0, 1)),
    potrzebny_sprzet TEXT NOT NULL,

    skala_linowa TEXT NOT NULL,
    FOREIGN KEY (nazwa_skaly, nazwa_sektoru, nazwa_rejonu) REFERENCES Skaly(nazwa_skaly, nazwa_sektoru, nazwa_rejonu) ON DELETE CASCADE,
    FOREIGN KEY (skala_linowa) REFERENCES Skale_linowe(francuska)
);

CREATE TABLE Bouldery (
    id_bouldera INTEGER PRIMARY KEY AUTOINCREMENT,

    nazwa_drogi TEXT NOT NULL,
    nazwa_skaly TEXT NOT NULL,
    nazwa_sektoru TEXT NOT NULL,
    nazwa_rejonu TEXT NOT NULL,
    data_utworzenia TEXT NOT NULL,
    opis TEXT,

    wysokosc REAL NOT NULL,
    liczba_potrzebnych_crashpadow INTEGER,

    skala_boulderowa TEXT NOT NULL,
    FOREIGN KEY (nazwa_skaly, nazwa_sektoru, nazwa_rejonu) REFERENCES Skaly(nazwa_skaly, nazwa_sektoru, nazwa_rejonu) ON DELETE CASCADE,
    FOREIGN KEY (skala_boulderowa) REFERENCES Skale_boulderowe(font)
);


CREATE TABLE Uzytkownicy (
    login TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    haslo TEXT NOT NULL,
    imie TEXT NOT NULL,
    nazwisko TEXT NOT NULL
);

CREATE TABLE Znajomi (
    login_uzytkownika TEXT NOT NULL,
    login_znajomego TEXT NOT NULL,
    PRIMARY KEY (login_uzytkownika, login_znajomego),
    FOREIGN KEY (login_uzytkownika) REFERENCES Uzytkownicy(login) ON DELETE CASCADE,
    FOREIGN KEY (login_znajomego) REFERENCES Uzytkownicy(login) ON DELETE CASCADE,
    CHECK (login_uzytkownika <> login_znajomego)
);


CREATE TABLE Style_przejscia (
    nazwa_stylu TEXT PRIMARY KEY
);

CREATE TABLE Przejscia (
    id_przejscia INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    uri_timeline TEXT,
    notatka TEXT,
    login TEXT NOT NULL,
    nazwa_stylu TEXT NOT NULL,
    
    id_drogi_sportowej INTEGER,
    id_tradu INTEGER,
    id_bouldera INTEGER,

    FOREIGN KEY (login) REFERENCES Uzytkownicy(login) ON DELETE CASCADE,
    FOREIGN KEY (nazwa_stylu) REFERENCES Style_przejscia(nazwa_stylu),
    
    FOREIGN KEY (id_drogi_sportowej) REFERENCES Drogi_sportowe(id_drogi_sportowej) ON DELETE CASCADE,
    FOREIGN KEY (id_tradu) REFERENCES Trady(id_tradu) ON DELETE CASCADE,
    FOREIGN KEY (id_bouldera) REFERENCES Bouldery(id_bouldera) ON DELETE CASCADE,

    CONSTRAINT przejscie_jedna_droga_chk CHECK (
        (id_drogi_sportowej IS NOT NULL AND id_tradu IS NULL AND id_bouldera IS NULL) OR
        (id_drogi_sportowej IS NULL AND id_tradu IS NOT NULL AND id_bouldera IS NULL) OR
        (id_drogi_sportowej IS NULL AND id_tradu IS NULL AND id_bouldera IS NOT NULL)
    )
);

CREATE TABLE Reakcje (
    login TEXT NOT NULL,
    id_przejscia INTEGER NOT NULL,
    PRIMARY KEY (login, id_przejscia),
    FOREIGN KEY (login) REFERENCES Uzytkownicy(login) ON DELETE CASCADE,
    FOREIGN KEY (id_przejscia) REFERENCES Przejscia(id_przejscia) ON DELETE CASCADE
);

CREATE TABLE Pomiary_wyciagow (
    id_sesji INTEGER PRIMARY KEY AUTOINCREMENT,
    id_urzadzenia TEXT,
    start_pomiaru TEXT NOT NULL,
    koniec_pomiaru TEXT NOT NULL,
    max_wysokosc REAL NOT NULL,
    min_wysokosc REAL NOT NULL,
    max_sila REAL NOT NULL,
    id_przejscia INTEGER NOT NULL,
    FOREIGN KEY (id_przejscia) REFERENCES Przejscia(id_przejscia) ON DELETE CASCADE
);