export interface Reaction {
    id?: number;
    id_uzytkownika: number;
    id_przejscia: string;
    imie?: string;
    nazwisko?: string;
    username?: string;
    data_reakcji?: string;
    wyswietlono: number; // 0 = unread, 1 = read
}

export interface ReactionNotification {
    id: number;
    id_uzytkownika: number;
    id_przejscia: string;
    imie: string;
    nazwisko: string;
    username: string;
    data_reakcji: string;
    wyswietlono: number;
    nazwa_drogi: string;
}
