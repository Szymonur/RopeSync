import { SQLiteDatabase } from "expo-sqlite";

export async function initializeDatabase(db: SQLiteDatabase) {
    // 1. Optymalizacje silnika SQLite (Bardzo ważne w pracy inżynierskiej!)
    await db.execAsync(`
    -- Write-Ahead Logging: Znacznie przyspiesza zapisy i pozwala na równoległe odczyty.
    -- Idealne dla aplikacji, która w tle będzie zapisywać dane z ESP32.
    PRAGMA journal_mode = WAL;
    
    -- Wymuszenie sprawdzania kluczy obcych (domyślnie w SQLite jest to wyłączone!).
    -- Dzięki temu jak usuniesz przejście, usuną się też jego wyciągi i upadki (ON DELETE CASCADE).
    PRAGMA foreign_keys = ON;
  `);

    // 2. Prosty i profesjonalny system migracji
    // Sprawdzamy aktualną wersję schematu bazy danych. Domyślnie jest to 0.
    const result = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version",
    );
    let currentDbVersion = result?.user_version ?? 0;

    if (currentDbVersion === 0) {
        console.log("Inicjalizacja bazy danych RopeSync: Wersja 1");

        // Używamy execAsync do wykonania bloku kodu SQL
        await db.execAsync(`
      -- TABELA GŁÓWNA: PRZEJŚCIA (Activities)
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,               -- Polecam UUID zamiast INTEGER (łatwiejsza synchronizacja)
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,                -- ISO 8601 string (np. "2026-04-27T14:30:00Z")
        type TEXT NOT NULL,                -- 'sport' | 'trad'
        is_multi_pitch INTEGER NOT NULL,   -- 0 (false) lub 1 (true)
        title TEXT,
        description TEXT,
        difficulty TEXT,
        scale TEXT,                        -- 'francuska', 'UIAA', 'Kurtyki', itp.
        sync_status TEXT DEFAULT 'PENDING' -- 'PENDING', 'SYNCING', 'SYNCED'
      );

      -- TABELA DZIECKO: WYCIĄGI (Pitches)
      CREATE TABLE IF NOT EXISTS pitches (
        id TEXT PRIMARY KEY,
        activity_id TEXT NOT NULL,
        pitch_number INTEGER NOT NULL,
        difficulty TEXT,
        notes TEXT,
        start_height REAL,                 -- Wysokość n.p.m (z barometru)
        end_height REAL,
        imu_data_uri TEXT,                 -- Ścieżka do pliku binarnego/JSON w Expo File System z danymi do rysowania 3D
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      );

      -- TABELA DZIECKO: UPADKI (Falls)
      CREATE TABLE IF NOT EXISTS falls (
        id TEXT PRIMARY KEY,
        pitch_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,           -- Dokładny czas upadku
        max_force REAL NOT NULL,           -- Wartość Newtonach z tensometru
        telemetry_file_uri TEXT,           -- Ścieżka do pliku ze szczegółowym wykresem siły
        FOREIGN KEY (pitch_id) REFERENCES pitches(id) ON DELETE CASCADE
      );

      -- TABELA DZIECKO: ZDJĘCIA I METADANE (Media)
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        activity_id TEXT NOT NULL,
        uri TEXT NOT NULL,                 -- Ścieżka lokalna (file://...)
        timestamp TEXT,                    -- Czas zrobienia zdjęcia (do korelacji z wyciągiem)
        description TEXT,                  -- Np. "Kluczowy spit"
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      );
    `);

        currentDbVersion = 1;
        // Zapisujemy nową wersję schematu
        await db.execAsync(`PRAGMA user_version = ${currentDbVersion}`);
    }

    // W przyszłości, jak będziesz chciał dodać np. tętno z zegarka, zrobisz tak:
    // if (currentDbVersion === 1) {
    //   await db.execAsync(`ALTER TABLE activities ADD COLUMN heart_rate REAL;`);
    //   currentDbVersion = 2;
    //   await db.execAsync(`PRAGMA user_version = ${currentDbVersion}`);
    // }
}
