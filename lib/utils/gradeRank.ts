// Porządek wycen wspinaczkowych. Zwraca liczbę: większa = trudniejsza droga, -1 = wycena nieznana.
// Obsługuje skalę Kurtyki (I ... VI, VI.1 ... VI.7, z "+", "-" i wycenami łamanymi typu "VI.4+/5")
// oraz skalę francuską / Fontainebleau (np. "6a+", "7b").
// Wartości z różnych skal nie są ze sobą porównywalne - porównuj wyceny w obrębie jednego typu drogi.
// UWAGA: ten sam plik jest w aplikacji (lib/utils/gradeRank.ts) i na backendzie (utils/gradeRank.ts).

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };

const rankSingle = (grade: string): number => {
    const kurtyka = /^(VI|IV|V|III|II|I)(?:\.(\d))?([+-])?$/.exec(grade);
    if (kurtyka) {
        const base = ROMAN[kurtyka[1]] + (kurtyka[2] ? Number(kurtyka[2]) : 0);
        const modifier = kurtyka[3] === "+" ? 3 : kurtyka[3] === "-" ? -3 : 0;
        return base * 10 + modifier;
    }

    const french = /^(\d)([ABC])?(\+)?$/.exec(grade);
    if (french) {
        const letter = french[2] ? "ABC".indexOf(french[2]) : 0;
        return Number(french[1]) * 30 + letter * 10 + (french[3] ? 5 : 0);
    }

    return -1;
};

export const gradeRank = (grade: string | null | undefined): number => {
    if (!grade) return -1;
    const normalized = grade.trim().toUpperCase();
    if (!normalized) return -1;

    // Wycena łamana ("VI.4+/5", "VI+/VI.1", "III - IV") leży tuż nad swoją dolną granicą
    const parts = normalized.split(/\s*[/]\s*|\s+-\s+/);
    const lower = rankSingle(parts[0]);
    if (lower < 0) return -1;
    return parts.length > 1 ? lower + 1 : lower;
};

// Z listy elementów wybiera ten o najwyższej wycenie; przy remisie - o późniejszej dacie.
export const pickHardest = <T extends { wycena?: string | null; data?: string | null }>(
    items: T[],
): T | null => {
    let best: T | null = null;
    let bestRank = -1;
    for (const item of items) {
        const rank = gradeRank(item.wycena);
        if (rank < 0) continue;
        if (
            best === null ||
            rank > bestRank ||
            (rank === bestRank && (item.data ?? "") > (best.data ?? ""))
        ) {
            best = item;
            bestRank = rank;
        }
    }
    return best;
};
