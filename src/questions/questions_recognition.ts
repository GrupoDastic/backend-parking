/**
 * Comandos que reconoce y la informacion que devuelve:
 * cm1 - Disponibilidad de parqueaderos en cualquier zona
 * cm2 - Lista de las zonas con parqueo disponible.
 * cm3 - Repite la ultima informacion dada (No esta implementado aún)
 * cm4 - Disponibilidad de un parqueadero especifico
 * cm5 - Disponibilidad de parqueaderos en una zona especifica
 * cm6 - Zona a la que pertenece un parqueadero
 * cm7 - Saluda al usuario y ofrece servicios
 * cm8 - Menu de servicios
 */
export const recognizeQuestionPattern = (inputPatternArray: string[]) => {
    const hasNumber = inputPatternArray.includes("number");
    const hasZone = inputPatternArray.includes("zone");
    const hasReference = inputPatternArray.includes("reference");
    const hasParking = inputPatternArray.includes("parking");
    const hasHello = inputPatternArray.includes("hello");
    const hasHelp = inputPatternArray.includes("help");

    if (!hasNumber) {
        if (hasZone) return "cm2";        // Lista de las zonas con parqueo disponible.
        if (hasParking) return "cm1";     // Disponibilidad de parqueaderos en cualquier zona.
        if (hasHello) return "cm7";       // Saluda al usuario y ofrece servicios.
        if (hasHelp) return "cm8";        // Menú de servicios.
        return "cm9";                     // Pide al usuario que repita el comando.
    }

    if (!hasZone) return "cm4";           // Disponibilidad de un parqueadero específico.
    if (!hasReference) return "cm5";      // Disponibilidad en una zona específica.

    return "cm6";                         // Zona a la que pertenece un parqueadero.
};


