/**
 * Segun el comando, devuelve los datos solicitados en una cadena de texto de respuesta.
 */
import {Parking} from "../types";

export default function questionsReplies(commandCode: string, parameter: number | null, data: Parking[]) {
    let result = "";
    let zones: number[] = [];
    switch (commandCode) {
        // Devuelve el primer parqueo disponibles de las 5 primeras zonas.
        case "cm1": {
            let parkingsFree = data;
            if (parkingsFree.length > 0) {
                parkingsFree.forEach(parking => {
                    if ((zones.indexOf(parking.id_zona) < 0) && (zones.length <= 3)) {
                        zones.push(parking.id_zona);
                        result += "En la zona " + parking.id_zona + " está disponible el parqueadero " + parking.id_parqueadero + ". ";
                    }
                });
            } else {
                result = "Lo siento, en estos momentos no hay parqueaderos disponibles.";
            }
            break;
        }
        // Devuelve las zonas en las que hay parqueos disponibles.
        case "cm2":
            data.forEach(parking => {
                if (zones.indexOf(parking.id_zona) < 0) {
                    zones.push(parking.id_zona);
                }
            });
            if (zones.length === 1) {
                result = "Hay un parqueo disponible en la zona " + zones[0];
            } else if (zones.length > 1) {
                result = "Hay parqueos disponibles en zona " + zones.join(", zona ");
            } else {
                result = "Lo siento, en estos momentos no hay zonas con parqueaderos disponibles.";
            }
            break;

        case "cm3":     // Repite la ultima informacion.

            break;

        // Disponibilidad de un parqueadero especifico.
        case "cm4": {
            const park = data;
            if (park.length > 0) {
                if (park[0].estado === 0) {
                    result = "El parqueadero " + park[0].id_parqueadero + " de la zona " + park[0].id_zona + " está disponible ahora.";
                } else {
                    result = "Lo siento, el parqueadero " + park[0].id_parqueadero + " de la zona " + park[0].id_zona + " está ocupado.";
                    //Sugerir otros parqueaderos.
                }
            } else {
                result = "El parqueadero " + parameter + " no existe.";
            }
            break;
        }
        // Devuelve los primeros parqueos disponibles en la zona especificada.
        case "cm5": {
            let freeOnZone = data;
            if (freeOnZone.length === 1) {
                result = "En la zona " + parameter + " está disponible el parqueadero " + freeOnZone[0].id_parqueadero + ".";
            } else if (freeOnZone.length > 1) {
                if (freeOnZone.length > 5) freeOnZone = freeOnZone.slice(0, 3);
                const parkingsId = freeOnZone.map(({id_parqueadero}) => (id_parqueadero));
                result = "En la zona " + parameter + " están disponibles: el parqueadero " + parkingsId.join(", parqueadero ");
            } else {
                result = "Lo siento, en la zona " + parameter + " no hay parqueaderos disponibles.";
            }
            break;
        }
        case "cm6": {
            const parking = data;
            if (parking.length > 0) {
                if (parking[0].estado === 0) {
                    result = "El parqueadero " + parking[0].id_parqueadero + " pertenece a la zona " + parking[0].id_zona + " y está disponible ahora.";
                } else {
                    result = "El parqueadero " + parking[0].id_parqueadero + " pertenece a la zona " + parking[0].id_zona + " y está ocupado ahora.";
                }
            } else {
                result = "El parqueadero " + parameter + " no existe.";
            }
            break;
        }
        case "cm7":
            result = "Hola. Si necesita parquear su vehículo, le puedo ayudar. Solo debe pedir un parqueo o pedir el menú del servicio.";
            break;

        case "cm8":
            result += "Le puedo ayudar a: ";
            result += "Conocer parqueaderos disponibles en zonas diferentes. ";
            result += "Saber las zonas con parqueaderos disponibles. ";
            result += "Conocer la disponibilidad de un parqueadero especifico. ";
            result += "Saber la disponibilidad de parqueaderos en una zona especifica. ";
            result += "Saber a que zona pertenece un parqueadero. ";
            result += "Usted solo debe pedir la información y será respondida. ";
            break;

        case "cm9":
            result = "Lo siento, no le entendí. ¿Puede repetir?";
            break;

        default:
            break;
    }

    return {"text": result, "data": data};
};



