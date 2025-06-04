export type SymbolsType = Record<string, string[]>;

export type Parking = {
    id: number; // ID del parqueadero
    zone_id: number; // ID de la zona a la que pertenece
    zone_name: string; // 🆕 Nombre de la zona
    zone_identifier: string; // 🆕 Identificador único de la zona
    identifier: string; // Identificador único del espacio
    type: string; // Tipo de parqueadero (ejemplo: "common", "disabled", etc.)
    status: "free" | "occupied"; // Estado del parqueadero
    number: number; // Número de parqueadero
    plate?: string | null; // Placa del vehículo si está ocupado
    last_updated: string; // Última actualización en formato timestamp
    position_x?: number | null; // Posición en el eje X en el mapa
    position_y?: number | null; // Posición en el eje Y en el mapa
    orientation: "horizontal" | "vertical"; // Orientación del parqueadero
    strip_identifier: number; // Identificador de la franja a la que pertenece
    strip_name: string; // 🆕 Nombre de la franja
};


