import api from "../../../lib/api/client";
import { IAscentRepository } from "../interfaces/IAscentRepository";
import { Ascent, AscentStyle } from '../../../types/ascent';


export class ApiAscentRepository implements IAscentRepository {
	async getAscents(signal?: AbortSignal): Promise<Ascent[]> {
        try {
            const response = await api.get<{ message: string; ascents: Ascent[] }>(`/ascents`, { signal });   
            return response.data.ascents;
        } catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas pobierania przejść.");
            }
            throw new Error("Problem z połączeniem sieciowym.");
        }
    }
	async getAscent(ascentId: string, ownerId?: number, signal?: AbortSignal): Promise<Ascent> {
		try {
			const response = await api.get<{message: string; ascent: Ascent; }>(`/ascents/${ascentId}`, { signal });
			return response.data.ascent;
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas pobierania szczegułów przejscia.");
            }1
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async getStyles(): Promise<AscentStyle[]> {
		try {
			const response = await api.get<{message: string; styles: AscentStyle[]; }>(`/ascents/styles`);
			return response.data.styles;
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas pobierania mozliwych styli przejść.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async deleteAscent(ascentId: string): Promise<void> {
		try {
			await api.delete<{message: string}>(`/ascents/${ascentId}`);
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas usuwania przejscia.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	async addAscent(ascent: Ascent): Promise<void> {
		try {
			await api.post<{message: string}>(`/ascents/`, ascent);
		} catch (error: any) {
            if (error.response) {
                throw new Error("Wystąpił błąd podczas dodawania przejscia.");
            }
        	throw new Error("Problem z połączeniem sieciowym.");
        }
	}
	
}