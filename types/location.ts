export interface Sector {
    id_sektoru: number;
    nazwa_sektoru: string;
    id_rejonu: number;
    szerokosc_geograficzna: number;
    dlugosc_geograficzna: number;
}

export interface Region {
    id_rejonu: number;
    nazwa_rejonu: string;
    szerokosc_geograficzna: number;
    dlugosc_geograficzna: number;
    kraj?: string;
}

export interface Rock {
    id_skaly: number;
    id_sektoru: number;
    nazwa_skaly: string;
    szerokosc_geograficzna: number;
    dlugosc_geograficzna: number;
    czy_zakaz: boolean;
    materia: string;
}