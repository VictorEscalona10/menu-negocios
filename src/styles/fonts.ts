/**
 * URL de Google Fonts CSS para las tipografías seleccionadas.
 * Pide todos los pesos del sistema (400–900); la API de Google ignora
 * los pesos que la fuente no tenga y responde 200 igual.
 */
export function buildGoogleFontsUrl(fonts: string[]) {
    const unique = [...new Set(fonts.filter(Boolean))]
    const params = unique
        .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800;900`)
        .join('&')
    return `https://fonts.googleapis.com/css2?${params}&display=swap`
}
