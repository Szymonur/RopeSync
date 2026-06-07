export interface Ascent {
    id_przejscia: string;
    data: string;
    notatka: string;
    timeline_data: object;
    id_uzytkownika: number;
    nazwa_stylu: string;
    id_drogi: string;
    synced?: number; 
    deleted?: number;
    nazwa_drogi?: string;
    typ_drogi?: string;
    wycena?: string;
	imie?: string;
	nazwisko?: string;
	username?: string;
}

export interface AscentStyle {
	nazwa_stylu: string;
}