/**
 * Busca numeros y textos que representen a numeros y los devuelve como Integer.
 * @param {*} inputString - El texto de entrada donde se deben buscar numeros.
 * @returns - Devuelve como integer el número encontrado o un null si no hay.
 */
export default function readNumber(inputString: string) {
    try {
        // Ordinales
        inputString = inputString.replaceAll("primero", "1");
        inputString = inputString.replaceAll("segundo", "2");
        inputString = inputString.replaceAll("tercero", "3");
        inputString = inputString.replaceAll("cuarto", "4");
        inputString = inputString.replaceAll("quinto", "5");
        inputString = inputString.replaceAll("sexto", "6");
        inputString = inputString.replaceAll("séptimo", "7");
        inputString = inputString.replaceAll("octavo", "8");
        inputString = inputString.replaceAll("noveno", "9");
        inputString = inputString.replaceAll("décimo", "10");

        // Numeros
        inputString = inputString.replaceAll("uno", "1");
        inputString = inputString.replaceAll("dos", "2");
        inputString = inputString.replaceAll("tres", "3");
        inputString = inputString.replaceAll("cuatro", "4");
        inputString = inputString.replaceAll("cinco", "5");
        inputString = inputString.replaceAll("seis", "6");
        inputString = inputString.replaceAll("siete", "7");
        inputString = inputString.replaceAll("ocho", "8");
        inputString = inputString.replaceAll("nueve", "9");
        inputString = inputString.replaceAll("diez", "10");

        inputString = inputString.replace(/[^0-9]+/g, "");
        if (inputString !== "") return Number(inputString);
        return null;
    } catch (error) {
        return null;
    }
}


