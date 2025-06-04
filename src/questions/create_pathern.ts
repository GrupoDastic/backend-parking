import natural from "natural";
import { SymbolsType } from "../types";

// 🔹 Se agregan nombres de zonas, franjas y sus identificadores
const SYMBOLS: SymbolsType = {
    "status": ["disponible", "libre", "ocupado", "lleno", "vacio", "asequible", "espacio"],
    "parking": ["parqueo", "parqueadero", "estacionamiento", "aparcamiento", "lugar"],
    "zone": ["zona", "zonas", "área", "áreas", "bloque", "bloques"],
    "strips": ["franja", "franjas", "línea", "carril", "sección"],
    "will": ["necesito", "quiero", "puede", "puedo", "dame"],
    "reference": ["donde", "pertenece", "ubicado", "encuentra"],
    "repeat": ["repite", "repita", "no entendi", "no entiendo", "repeat"],
    "hello": ["hola", "buenos días", "buenas tardes"],
    "help": ["ayuda", "información", "menú"],
    "zone_name": [
        "secretaría", "capilla", "cafetería", "computación", "laboratorios",
    ],
    "zone_identifier": [
        "B", "H", "G", "D", "C"
    ],
    "strip_identifier": [
        "1", "2", "3", "4", "5"
    ]
};

/**
 * Crea un patrón de símbolos basado en la entrada del usuario.
 */
export default function createPattern(inputString: string): string[] {
    let pattern: string[] = [];

    try {
        // Detectar números en la consulta
        if (/\d+/.test(inputString)) {
            pattern.push("number");
        }

        const tokenizer = new natural.WordTokenizer();
        const tokens: string[] = tokenizer.tokenize(inputString.toLowerCase()) || [];

        Object.keys(SYMBOLS).forEach((key) => {
            if (SYMBOLS[key].some(symbol =>
                tokens.some(word => natural.LevenshteinDistance(symbol, word) <= 1)
            )) {
                pattern.push(key);
            }
        });

        // Si se encuentra un identificador de zona o franja, agregar "zone" o "strips"
        if (pattern.includes("zone_identifier") || pattern.includes("zone_name")) {
            pattern.push("zone");
        }
        if (pattern.includes("strip_identifier")) {
            pattern.push("strips");
        }

    } catch (error) {
        console.error("Error en createPattern:", error);
    }

    console.log("Patrón creado:", pattern);
    return pattern;
}
