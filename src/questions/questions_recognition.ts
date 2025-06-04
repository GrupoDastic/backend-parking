/**
 * Comandos que reconoce y la información que devuelve:
 * cm1  - Disponibilidad de parqueaderos en cualquier zona.
 * cm2  - Lista de las zonas con parqueo disponible.
 * cm3  - Repite la última información dada (No implementado aún).
 * cm4  - Disponibilidad de un parqueadero específico.
 * cm5  - Disponibilidad de parqueaderos en una zona específica.
 * cm6  - Zona a la que pertenece un parqueadero.
 * cm7  - Saludo al usuario y ofrece servicios.
 * cm8  - Menú de servicios.
 * cm9  - No entendió la pregunta.
 * cm10 - Obtener strips (franjas) en una zona específica.
 * cm11 - Obtener parqueaderos en una franja específica dentro de una zona.
 */

export const recognizeQuestionPattern = (inputPatternArray: string[]): string => {
    const hasNumber = inputPatternArray.includes("number");
    const hasZone = inputPatternArray.includes("zone");
    const hasZoneName = inputPatternArray.includes("zone_name");
    const hasZoneIdentifier = inputPatternArray.includes("zone_identifier");
    const hasParking = inputPatternArray.includes("parking");
    const hasStrips = inputPatternArray.includes("strips");
    const hasStripIdentifier = inputPatternArray.includes("strip_identifier");
    const hasHello = inputPatternArray.includes("hello");
    const hasHelp = inputPatternArray.includes("help");
    const hasReference = inputPatternArray.includes("reference");
    const hasStatus = inputPatternArray.includes("status"); // Detectar estado de parqueo

    // 🚀 1️⃣ Saludo
    if (hasHello) return "cm7";

    // 🚀 2️⃣ Solicitud de ayuda o menú
    if (hasHelp) return "cm8";

    // 🚀 3️⃣ Disponibilidad de parqueaderos en una franja específica dentro de una zona (cm11)
    if ((hasZoneName || hasZoneIdentifier) && hasStripIdentifier && hasParking) {
        return "cm11";
    }

    // 🚀 4️⃣ Obtener franjas de una zona específica (cm10)
    if (hasZone && hasStrips && !hasParking) {
        return "cm10";
    }

    // 🚀 5️⃣ Lista de zonas con parqueaderos disponibles (cm2)
    if ((hasZoneName || hasZoneIdentifier) && !hasParking) {
        return "cm2";
    }

    // 🚀 6️⃣ Disponibilidad de parqueaderos en una zona específica (cm5)
    if ((hasZoneName || hasZoneIdentifier) && hasParking) {
        return "cm5";
    }

    // 🚀 7️⃣ Disponibilidad de un parqueadero específico (cm4)
    if (hasNumber && hasParking && !hasZone) {
        return "cm4";
    }

    // 🚀 8️⃣ Saber a qué zona pertenece un parqueadero (cm6)
    if (hasNumber && hasReference) {
        return "cm6";
    }

    // 🚀 9️⃣ Búsqueda de parqueaderos en cualquier zona con un estado específico (cm1)
    if (hasParking && hasStatus) {
        return "cm1";
    }

    // 🚀 🔟 Disponibilidad de parqueaderos en cualquier zona sin especificar (cm1)
    if (hasParking && !hasZone && !hasStrips && !hasNumber) {
        return "cm1";
    }

    // 🚀 🔟1 No entendió la consulta (cm9)
    return "cm9";
};




