import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import areasData from "./sokoliki_routes.json";

const getDeterministicUUID = async (rockName: string, routeName: string): Promise<string> => {
    const inputString = `${rockName}-${routeName}`;
    
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        inputString
    );
    return [
        digest.substring(0, 8),
        digest.substring(8, 12),
        '4' + digest.substring(13, 16),
        '8' + digest.substring(17, 20),
        digest.substring(20, 32)
    ].join('-');
};
interface Route {
    name: string;
    grade: string | null;
    style: string;
    length_m: number | null;
    bolts: number | null;
}

interface Area {
    area_name: string;
    area_url: string;
    routes: Route[];
}

const rockToSectorMap: Record<string, string> = {
	"Krzywa Turnia": "Grupa Sukiennic",
    "Sukiennice": "Grupa Sukiennic",
    "Chatka": "Grupa Sukiennic",
    "Stodoła": "Grupa Sukiennic",
    "Michały": "Grupa Sukiennic",
    "Loża": "Grupa Sukiennic",
    "Solarium": "Grupa Sukiennic",
    "Buła": "Grupa Sukiennic",
    "Skałka nad Ogniskiem": "Grupa Sukiennic",
    "Gilotyna": "Grupa Sukiennic",
    "Lama": "Grupa Sokolików",
    "Jastrzębiec": "Grupa Sokolików",
    "Okienna": "Grupa Sokolików",
    "Sokolik Duży": "Grupa Sokolików",
    "Baba": "Grupa Sokolików",
    "Małpia Ścianka": "Grupa Sokolików",
    "Sokolik Mały": "Grupa Sokolików",
    "Sokola Lalka": "Grupa Sokolików",
    "Sokola i Bobrowa Turniczka": "Grupa Sokolików",
    "Ptak": "Grupa Zipserowej i Tępej",
    "Tępa": "Grupa Zipserowej i Tępej",
    "Leśna": "Grupa Zipserowej i Tępej",
    "Zipserowa Czuba": "Grupa Zipserowej i Tępej",
    "Płetwa": "Grupa Zipserowej i Tępej",
    "Husyckie Skały": "Husyckie Skały",
    "Turnia Panfila": "Husyckie Skały",
    "Trzy Korony": "Husyckie Skały",
    "Srebrna Skała": "Husyckie Skały",
    "Jastrzębia Turnia": "Grupa Jastrzębiej Turni",
    "Rogatka": "Grupa Jastrzębiej Turni",
    "Swarożyc": "Grupa Jastrzębiej Turni",
    "Szara Turnia": "Grupa Jastrzębiej Turni",
    "Zapomniana": "Grupa Jastrzębiej Turni",
    "Brzuchata": "Grupa Jastrzębiej Turni",
    "Żyletka": "Grupa Jastrzębiej Turni",
    "Smocza Baszta": "Grupa Jastrzębiej Turni",
    "Bukowe Skały": "Grupa Krzyżnej Skały",
    "Zamkowe Skały": "Grupa Krzyżnej Skały",
    "Krzyżny Michał": "Grupa Krzyżnej Skały",
    "Sokolec": "Grupa Krzyżnej Skały",
    "Krzyżna Skała": "Grupa Krzyżnej Skały",
    "Krzyżna Strażnica": "Grupa Krzyżnej Skały",
    "Skała z Kulą": "Grupa Krzyżnej Skały",
    "Słoń": "Grupa Krzyżnej Skały"
};

export const seedMobileDatabase = async (db: SQLite.SQLiteDatabase): Promise<void> => {
    try {
        console.log("Rozpoczęto seedowanie bazy mobilnej (SQLite)...");
        await db.execAsync("BEGIN TRANSACTION;");

        await db.execAsync(`
            INSERT OR IGNORE INTO Typy_skaly (materia) VALUES ('Wapień'), ('Granit'), ('Piaskowiec');
            INSERT OR IGNORE INTO Style_przejscia (nazwa_stylu) VALUES ('OS'), ('Flash'), ('RP'), ('AF'), ('TR');
        `);
        console.log("Słowniki dodane.");

        const areas: Area[] = areasData as Area[];

        const rejonRes = await db.getFirstAsync<{ id_rejonu: number }>(`
            INSERT INTO Rejony (nazwa_rejonu, kraj) 
            VALUES (?, ?) 
            ON CONFLICT (nazwa_rejonu) DO UPDATE SET nazwa_rejonu = excluded.nazwa_rejonu 
            RETURNING id_rejonu;
        `, ['Sokoliki', 'Polska']);
        const idRejonu = rejonRes?.id_rejonu;

        if (!idRejonu) throw new Error("Błąd podczas tworzenia rejonu");

        await db.runAsync(`
            INSERT OR IGNORE INTO Skale_linowe (francuska, kurtyki, yds, przymiotnikowa)
            VALUES (?, ?, ?, ?);
        `, ['grade', 'Brak wyceny', 'Nieznana', 'Nieznana']);

        const uniqueGrades = new Set<string>();
        areas.forEach(area => area.routes.forEach(route => {
            if (route.grade && route.grade !== "Grade") uniqueGrades.add(route.grade);
        }));

        for (const grade of uniqueGrades) {
            const francuskaLow = grade.toLowerCase();
            await db.runAsync(`
                INSERT OR IGNORE INTO Skale_linowe (francuska, kurtyki, yds, przymiotnikowa)
                VALUES (?, ?, ?, ?);
            `, [francuskaLow, grade, 'Nieznana', 'Nieznana']);
        }
        console.log("Wyceny linowe zaktualizowane.");

        for (const area of areas) {
            const rockName = area.area_name;
            const sectorName = rockToSectorMap[rockName] || "Pozostałe skały";

            const sektorRes = await db.getFirstAsync<{ id_sektoru: number }>(`
                INSERT INTO Sektory (nazwa_sektoru, id_rejonu) 
                VALUES (?, ?) 
                ON CONFLICT (nazwa_sektoru, id_rejonu) DO UPDATE SET nazwa_sektoru = excluded.nazwa_sektoru
                RETURNING id_sektoru;
            `, [sectorName, idRejonu]);
            
            const idSektoru = sektorRes?.id_sektoru;
            
            if (!idSektoru) {
                console.error(`Pominięto skałę ${rockName} - błąd tworzenia sektora.`);
                continue; 
            }

            const skalaRes = await db.getFirstAsync<{ id_skaly: number }>(`
                INSERT INTO Skaly (id_sektoru, nazwa_skaly, materia)
                VALUES (?, ?, ?)
                ON CONFLICT (nazwa_skaly, id_sektoru) DO UPDATE SET nazwa_skaly = excluded.nazwa_skaly
                RETURNING id_skaly;
            `, [idSektoru, rockName, 'Granit']);
            
            const idSkaly = skalaRes?.id_skaly;

            if (!idSkaly) {
                console.error(`Pominięto drogi na skale ${rockName} - błąd tworzenia skały.`);
                continue;
            }

            for (const route of area.routes) {
                const allowedStyles = ['Sport', 'Mixed trad', 'Trad', 'Boulder'];
                if (!allowedStyles.includes(route.style)) continue; 

               	const idDrogi = await getDeterministicUUID(rockName, route.name);
                const skalaLinowaKey = (route.grade && route.grade !== "Grade") ? route.grade.toLowerCase() : 'grade'; 

                const drogaInsert = await db.runAsync(`
                    INSERT OR IGNORE INTO Drogi (id_drogi, typ_drogi, nazwa_drogi, id_skaly, opis)
                    VALUES (?, ?, ?, ?, ?);
                `, [idDrogi, route.style, route.name, idSkaly, ""]);

                if (drogaInsert.changes > 0) {
                    if (route.style === 'Sport' || route.style === 'Mixed trad') {
                        await db.runAsync(`
                            INSERT INTO Drogi_sportowe_szczegoly (id_drogi, dlugosc_drogi, liczba_ringow, skala_linowa)
                            VALUES (?, ?, ?, ?);
                        `, [idDrogi, route.length_m || null, route.bolts || null, skalaLinowaKey]);
                    } 
                    else if (route.style === 'Trad') {
                        await db.runAsync(`
                            INSERT INTO Trady_szczegoly (id_drogi, dlugosc_drogi, skala_linowa)
                            VALUES (?, ?, ?);
                        `, [idDrogi, route.length_m || null, skalaLinowaKey]);
                    }
                }
            }
        }
        console.log("Drogi z JSON zaimportowane pomyślnie.");

        const dummyHash = "dummy_mobile_hash_for_testing"; // W mobilnej bazie nie szyfrujemy haseł
        const dummySalt = "salt_string_12345";

        await db.runAsync(`
            INSERT INTO Uzytkownicy (id_uzytkownika, login, email, haslo, sol, imie, nazwisko) VALUES
              (1, 'szymon_climber', 'szymon@ropesync.test', ?, ?, 'Szymon', 'Urban'),
              (2, 'kasia_alpinistka', 'kasia@ropesync.test', ?, ?, 'Katarzyna', 'Nowak'),
              (3, 'michal_crag', 'michal@ropesync.test', ?, ?, 'Michał', 'Kowalski')
            ON CONFLICT (id_uzytkownika) DO UPDATE 
            SET haslo = excluded.haslo, sol = excluded.sol;
        `, [dummyHash, dummySalt, dummyHash, dummySalt, dummyHash, dummySalt]);

        await db.runAsync(`
            INSERT OR IGNORE INTO Obserwacje (id_obserwujacego, id_obserwowanego) VALUES
              (1, 2), (1, 3);
        `);

        const wczytaneDrogi = await db.getAllAsync<{ id_drogi: string }>('SELECT id_drogi FROM Drogi LIMIT 3;');
        
        if (wczytaneDrogi.length >= 3) {
            await db.runAsync(`
                INSERT OR IGNORE INTO Przejscia (id_przejscia, data, timeline_data, notatka, id_uzytkownika, nazwa_stylu, id_drogi) VALUES
                (
                    'p_1', '2025-03-16', 
                    '{"timeline": [{"timestamp": 40, "height": 1.8, "events": [{"type": "clip", "clipingTime": 1.3, "force": 0.04, "belayRate": 9}]}, {"timestamp": 120, "height": 6.3, "events": [{"type": "clip", "clipingTime": 2, "force": 0.12, "belayRate": 7}]}, {"timestamp": 450, "height": 10.3, "events": [{"type": "fall", "force": 1.3, "duration": 2.5, "fallenDisnace": 4.1}]}, {"timestamp": 600, "height": 16.3, "events": [{"type": "clip", "clipingTime": 2, "force": 0.4, "belayRate": 2}]}, {"timestamp": 980, "height": 20.8, "events": [{"type": "anchor"}]}]}',
                    'Mocne przejście z małym lotem w połowie.', 1, 'RP', ?
                ),
                (
                    'p_2', '2025-04-02', 
                    '{"timeline": [{"timestamp": 30, "height": 2.0, "events": [{"type": "clip", "clipingTime": 1.0, "force": 0.02, "belayRate": 5}]}, {"timestamp": 150, "height": 9.5, "events": [{"type": "clip", "clipingTime": 1.5, "force": 0.08, "belayRate": 6}]}, {"timestamp": 420, "height": 18.0, "events": [{"type": "anchor"}]}]}',
                    'Czysty flesz / OS.', 1, 'OS', ?
                ),
                (
                    'p_3', '2025-04-10', 
                    '{"timeline": [{"timestamp": 50, "height": 3.0, "events": [{"type": "fall", "force": 2.1, "duration": 1.8, "fallenDisnace": 2.5}]}, {"timestamp": 200, "height": 11.0, "events": [{"type": "clip", "clipingTime": 2.5, "force": 0.5, "belayRate": 4}]}, {"timestamp": 550, "height": 20.0, "events": [{"type": "anchor"}]}]}',
                    'Walka z drogą.', 2, 'Flash', ?
                );
            `, [wczytaneDrogi[0].id_drogi, wczytaneDrogi[1].id_drogi, wczytaneDrogi[2].id_drogi]);
            console.log("Przejścia z osiami czasu podpięte!");
        }

        await db.execAsync("COMMIT;");
        console.log("SUKCES! Baza lokalna zasilona JSON-em i statystykami.");

    } catch (error) {
        await db.execAsync("ROLLBACK;");
        console.error("Błąd podczas seedowania na telefonie! Transakcja wycofana.", error);
    }
};