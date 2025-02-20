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
export const recogniceQuestionsPathern = (inputPathernArray: string[]) => {
    if (inputPathernArray.indexOf("number") >= 0) {
        if (inputPathernArray.indexOf("zone") >= 0) {
            if (inputPathernArray.indexOf("reference") >= 0) {
                return "cm6";       // Zona a la que pertenece un parqueadero. (numero de parqueadero)
            } else {
                return "cm5";       // Disponibilidad de parqueaderos en una zona especifica. (numero de zona)
            }
        } else {
            return "cm4";           // Devuelve la disponibilidad de un parqueadero especifico.
        }
    } else if (inputPathernArray.indexOf("zone") >= 0) {
        return "cm2";           // Lista de las zonas con parqueo disponible.
    } else {
        if (inputPathernArray.indexOf("parking") >= 0) return "cm1";    // Disponibilidad de parqueaderos en cualquier zona
        if (inputPathernArray.indexOf("hello") >= 0) return "cm7";      // Saluda al usuario y ofrece servicios.
        if (inputPathernArray.indexOf("help") >= 0) return "cm8";       // Menu de servicios.
        return "cm9";                                                   // Le pide al usuario que repita el comando.
    }
};

