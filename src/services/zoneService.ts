import { pool } from "../config/db";

export async function getAllZones() {
    const query = `
        SELECT z.id AS zone_id, z.identifier AS zone_identifier, z.name AS zone_name,
               COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS available_spaces
        FROM public.zones z
        LEFT JOIN public.strips s ON z.id = s.zone_id
        LEFT JOIN public.parking_spaces ps
               ON s.zone_id = ps.zone_id AND s.strip_identifier = ps.strip_identifier
        GROUP BY z.id;
    `;
    const { rows } = await pool.query(query);
    return rows;
}

export async function getStripsByZone(zoneId: string) {
    const query = `
        SELECT s.zone_id, s.strip_identifier, s.name AS strip_name,
               COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS free_spaces
        FROM public.strips s
        LEFT JOIN public.parking_spaces ps
               ON s.zone_id = ps.zone_id AND s.strip_identifier = ps.strip_identifier
        WHERE s.zone_id = $1
        GROUP BY s.zone_id, s.strip_identifier, s.name;
    `;
    const { rows } = await pool.query(query, [zoneId]);
    return rows;
}

export async function getParkingSpacesByStrip(zoneId: string, stripIdentifier: string) {
    const querySpaces = `
        SELECT id, identifier, type, status, number, last_updated,
               position_x, position_y, orientation, rotation, coordinates
        FROM public.parking_spaces
        WHERE zone_id = $1 AND strip_identifier = $2;
    `;

    const queryCount = `
        SELECT COUNT(id) AS free_spaces
        FROM public.parking_spaces
        WHERE status = 'free' AND zone_id = $1 AND strip_identifier = $2;
    `;

    const [spacesResult, countResult] = await Promise.all([
        pool.query(querySpaces, [zoneId, stripIdentifier]),
        pool.query(queryCount, [zoneId, stripIdentifier])
    ]);

    return {
        spaces: spacesResult.rows,
        freeCount: countResult.rows[0].free_spaces
    };
}

export async function getStripMap(zoneId: string, stripIdentifier: string) {
    const query = `
        SELECT zone_id, strip_identifier, svg_content, width, height, viewbox
        FROM public.strip_maps
        WHERE zone_id = $1 AND strip_identifier = $2;
    `;
    const { rows } = await pool.query(query, [zoneId, stripIdentifier]);
    return rows;
}
