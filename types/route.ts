export interface Route {
    id_drogi: string;
    typ_drogi: string;
    nazwa_drogi: string;
    nazwa_skaly: string;
    skala: string;}

export interface RouteListItem extends Route{
	nazwa_rejonu: string;
	wycena: string;
}

export interface RouteDetails extends Route {
    opis?: string;
    dlugosc_drogi?: number;
    liczba_ringow?: number;
    stanowisko?: string;
    czy_stanowiska?: boolean;
    wysokosc?: number;
    liczba_potrzebnych_crashpadow?: number;
    potrzebny_sprzet?: string;
    nazwa_sektoru: string;
    nazwa_rejonu: string;
}

export interface RouteFilters {
    nazwa_drogi?: string;
    skala?: string;
    typ_drogi?: string;
	id_sektoru?: number;
}