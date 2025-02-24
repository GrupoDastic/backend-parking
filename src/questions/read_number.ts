/**
 * Busca números y textos que representen números y los devuelve como Integer.
 * @param {string} inputString - El texto de entrada donde se deben buscar números.
 * @returns {number | null} - Devuelve el número encontrado o null si no hay.
 */
export default function readNumber(inputString: string): number | null {
    const numberMap: Record<string, string> = {
        "primero": "1", "segundo": "2", "tercero": "3", "cuarto": "4", "quinto": "5",
        "sexto": "6", "séptimo": "7", "octavo": "8", "noveno": "9", "décimo": "10",
        "uno": "1", "dos": "2", "tres": "3", "cuatro": "4", "cinco": "5",
        "seis": "6", "siete": "7", "ocho": "8", "nueve": "9", "diez": "10"
    };

    try {
        // Reemplazar palabras numéricas por su valor
        const regex = new RegExp(Object.keys(numberMap).join("|"), "gi");
        inputString = inputString.replace(regex, match => numberMap[match.toLowerCase()]);

        // Extraer números y devolver el primero encontrado
        const match = RegExp(/\d+/).exec(inputString);
        return match ? Number(match[0]) : null;
    } catch {
        return null;
    }
};
