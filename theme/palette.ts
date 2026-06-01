export const BrandPalette = {
    forest: "#273b1d",
    sand: "#e8e5c4",
    sage: "#91a06b",
    olive: "#728351",
    mist: "#b8c193",
    paper: "#f7f3e8",
    pineShadow: "#1c2c15",
    mossTint: "#d5dcc0",
    dusk: "#33412c",
    slate: "#6d735f",
} as const;

export const AppTheme = {
    light: {
        text: BrandPalette.forest,
        title: BrandPalette.pineShadow,
        background: BrandPalette.paper,
        navBackground: BrandPalette.mist,
        iconColour: BrandPalette.olive,
        iconColourFocused: BrandPalette.forest,
        uiBackground: "#fdfbf4",
        border: "#d5d1b6",
        inputBackground: "#fffdf7",
        accent: BrandPalette.sage,
        accentStrong: BrandPalette.olive,
        accentText: BrandPalette.pineShadow,
        cardShadow: "rgba(39, 59, 29, 0.08)",
        mutedText: BrandPalette.slate,
    },
    dark: {
        text: "#ecf2df",
        title: "#f7f7e8",
        background: "#10180f",
        navBackground: "#283621",
        iconColour: "#cfdbc1",
        iconColourFocused: "#f2edd1",
        uiBackground: "#33462b",
        border: "#8fa47a",
        inputBackground: "#3a4f31",
        accent: "#c3cf9f",
        accentStrong: "#dce3c0",
        accentText: "#1f2e17",
        cardShadow: "rgba(0, 0, 0, 0.32)",
        mutedText: "#dbe4cb",
    },
} as const;

export type ThemeColors = (typeof AppTheme)[keyof typeof AppTheme];