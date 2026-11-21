export const encodeToBase64 = (text: string): string => {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let str = text;
    let output = "";
    for (
        let block = 0, charCode, i = 0, map = chars;
        str.charAt(i | 0) || ((map = "="), i % 1);
        output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
        charCode = str.charCodeAt((i += 3 / 4));
        block = (block << 8) | charCode;
    }
    return output;
};

// Tablica odwrotna liczona raz - dekodowanie jest wołane dla każdej ramki BLE
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_LOOKUP = (() => {
    const table = new Uint8Array(128);
    for (let i = 0; i < BASE64_CHARS.length; i++) table[BASE64_CHARS.charCodeAt(i)] = i;
    return table;
})();

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const len = base64.length;
    let bufferLength = Math.floor(len * 0.75);
    if (base64[len - 1] === "=") {
        bufferLength--;
        if (base64[len - 2] === "=") {
            bufferLength--;
        }
    }
    const arraybuffer = new ArrayBuffer(bufferLength);
    const bytes = new Uint8Array(arraybuffer);
    let p = 0;
    for (let i = 0; i < len; i += 4) {
        const encoded1 = BASE64_LOOKUP[base64.charCodeAt(i)];
        const encoded2 = BASE64_LOOKUP[base64.charCodeAt(i + 1)];
        const encoded3 = BASE64_LOOKUP[base64.charCodeAt(i + 2) & 127];
        const encoded4 = BASE64_LOOKUP[base64.charCodeAt(i + 3) & 127];
        if (p < bufferLength) bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        if (p < bufferLength) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        if (p < bufferLength) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return arraybuffer;
};
