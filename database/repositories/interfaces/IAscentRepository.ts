import { Ascent, AscentStyle } from "../../../types/ascent";


export interface IAscentRepository {
	getAscents(): Promise<Ascent[]>;
	getAscent(ascentId: string, ownerId?: number): Promise<Ascent>;
	getStyles(): Promise<AscentStyle[]>;
	deleteAscent(ascentId: string): Promise<void>;
	addAscent(ascent: Ascent): Promise<void>;
}