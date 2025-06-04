import { Parking } from "../types";

export default function questionsReplies(commandCode: string, parameter: number | null, data: Parking[]) {
    let result = "";
    let zones: number[] = [];

    switch (commandCode) {
        // Disponibilidad de parqueaderos en cualquier zona
        case "cm1": {
            if (data.length > 0) {
                result = "Los siguientes parqueaderos están disponibles:\n";
                data.forEach(parking => {
                    result += `• Parqueadero ${parking.identifier} en la zona ${parking.zone_name} (${parking.zone_identifier}), en la franja ${parking.strip_name}.\n`;
                });
            } else {
                result = "Lo siento, no hay parqueaderos disponibles en este momento.";
            }
            break;
        }

        // Lista de zonas con parqueo disponible
        case "cm2":
            zones = [...new Set(data.map(parking => parking.zone_id))];
            if (zones.length === 1) {
                result = `Hay parqueos disponibles en la zona ${data[0].zone_name} (${data[0].zone_identifier}).`;
            } else if (zones.length > 1) {
                result = `Hay parqueos disponibles en las siguientes zonas: ${zones.map(id => data.find(z => z.zone_id === id)?.zone_name).join(", ")}.`;
            } else {
                result = "Lo siento, en estos momentos no hay zonas con parqueaderos disponibles.";
            }
            break;

        // Repetir última información (No implementado aún)
        case "cm3":
            result = "Lo siento, no puedo repetir la última información en este momento.";
            break;

        // Disponibilidad de un parqueadero específico
        case "cm4": {
            if (data.length > 0) {
                const parking = data[0];
                result = parking.status === "free"
                    ? `El parqueadero ${parking.identifier} en la zona ${parking.zone_id} está disponible.`
                    : `El parqueadero ${parking.identifier} en la zona ${parking.zone_id} está ocupado.`;
            } else {
                result = `El parqueadero ${parameter} no existe.`;
            }
            break;
        }

        // Disponibilidad de parqueaderos en una zona específica
        case "cm5": {
            if (data.length > 0) {
                result = `En la zona ${data[0].zone_name} (${data[0].zone_identifier}), los siguientes parqueaderos están disponibles:\n`;
                data.forEach(parking => {
                    result += `• Parqueadero ${parking.identifier}, en la franja ${parking.strip_name}.\n`;
                });
            } else {
                result = `Lo siento, en la zona ${parameter} no hay parqueaderos disponibles.`;
            }
            break;
        }

        // Zona a la que pertenece un parqueadero
        case "cm6": {
            if (data.length > 0) {
                const parking = data[0];
                result = `El parqueadero ${parking.identifier} pertenece a la zona ${parking.zone_name} (${parking.zone_identifier}) y está ${
                    parking.status === "free" ? "disponible" : "ocupado"
                } ahora.`;
            } else {
                result = `El parqueadero ${parameter} no existe.`;
            }
            break;
        }

        // 🚀 Agregar cm10: Obtener franjas en una zona específica
        case "cm10": {
            if (data.length > 0) {
                result = `En la zona ${data[0].zone_name} (${data[0].zone_identifier}), las siguientes franjas están disponibles:\n`;
                data.forEach(strip => {
                    result += `• Franja ${strip.strip_name} (ID: ${strip.strip_identifier}).\n`;
                });
            } else {
                result = `Lo siento, en la zona ${parameter} no hay franjas disponibles.`;
            }
            break;
        }

        // 🚀 Agregar cm11: Obtener parqueaderos en una franja dentro de una zona
        case "cm11": {
            if (data.length > 0) {
                result = `En la zona ${data[0].zone_name} (${data[0].zone_identifier}), en la franja ${data[0].strip_name}, los siguientes parqueaderos están disponibles:\n`;
                data.forEach(parking => {
                    result += `• Parqueadero ${parking.identifier}.\n`;
                });
            } else {
                result = `Lo siento, en la franja ${parameter} de la zona no hay parqueaderos disponibles.`;
            }
            break;
        }

        // Saludo y ayuda básica
        case "cm7":
            result = "Hola. Si necesita parquear su vehículo, le puedo ayudar. Solo pida un parqueo o consulte el menú de servicio.";
            break;

        // Menú de servicios
        case "cm8":
            result = `
                Le puedo ayudar a:
                - Conocer parqueaderos disponibles en distintas zonas.
                - Saber qué zonas tienen parqueaderos disponibles.
                - Verificar la disponibilidad de un parqueadero específico.
                - Consultar la disponibilidad de parqueaderos en una zona.
                - Consultar las franjas de una zona específica.
                - Ver los parqueaderos disponibles en una franja específica dentro de una zona.
                Solo pida la información y con gusto le responderé.
            `;
            break;

        // Mensaje de error por pregunta no entendida
        case "cm9":
            result = "Lo siento, no le entendí. ¿Puede repetir?";
            break;

        default:
            result = "Comando no reconocido.";
            break;
    }

    return { text: result.trim(), data };
}
