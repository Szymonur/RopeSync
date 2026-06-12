export interface Ascent {
    id_przejscia: string;
    data: string;
    notatka: string;
    timeline_data?: object;
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

export interface AscenFeedItem extends Ascent {
	isLiked: boolean;
}

export interface AscentStyle{
	nazwa_stylu: string;
}

export interface UserStats {
    totalCount: number;
    sportCount: number;
    tradCount: number;
    boulderCount: number;
    bestSport?: Ascent;
    bestTrad?: Ascent;
    bestBoulder?: Ascent;
    gradeChart: { label: string; count: number }[];
    weeklyChart: { label: string; count: number }[];
}

export interface AscentFilters {
    styles: string[];
	types: string[];
	dateFrom: string;
	dateTo: string;
	regionId?: number;
    sectorId?: number;
    routeId?: string;
 }