import { pool } from "../config/db";

export async function createReservation(
    zoneId: string,
    stripIdentifier: string,
    spaceId: string
) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(`
            UPDATE public.parking_spaces
            SET status = 'free',
                reservation_token = NULL,
                reservation_expires = NULL,
                reserved_by = NULL
            WHERE status = 'reserved'
              AND reservation_expires < NOW()
        `);

        const findQuery = `
            SELECT id
            FROM public.parking_spaces
            WHERE id = $1
              AND zone_id = $2
              AND strip_identifier = $3
              AND status = 'free'
                FOR UPDATE
        `;

        const { rows } = await client.query(findQuery, [
            spaceId,
            zoneId,
            stripIdentifier,
        ]);

        if (!rows.length) {
            await client.query("ROLLBACK");
            throw new Error("El espacio ya no está disponible.");
        }

        // 🔥 usamos otro nombre
        const lockedSpaceId = rows[0].id;

        const tokenResult = await client.query(
            `SELECT gen_random_uuid() AS token`
        );
        const token = tokenResult.rows[0].token;

        const updateQuery = `
            UPDATE public.parking_spaces
            SET status = 'reserved',
                reservation_token = $1,
                reservation_expires = NOW() + INTERVAL '5 minutes',
                last_updated = NOW()
            WHERE id = $2
            RETURNING *
        `;

        const updated = await client.query(updateQuery, [
            token,
            lockedSpaceId,
        ]);

        await client.query("COMMIT");

        return {
            reservation_token: token,
            reservation_expires: updated.rows[0].reservation_expires,
            parking_space: updated.rows[0],
            expires_in_seconds: 3 * 60,
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function confirmReservation(zoneId: string, stripIdentifier: string, token: string) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Verificar token válido y no expirado
        const findQuery = `
      SELECT id
      FROM public.parking_spaces
      WHERE zone_id = $1
        AND strip_identifier = $2
        AND reservation_token = $3
        AND status = 'reserved'
        AND reservation_expires > NOW()
      FOR UPDATE
    `;
        const { rows } = await client.query(findQuery, [zoneId, stripIdentifier, token]);

        if (!rows.length) {
            await client.query("ROLLBACK");
            throw new Error("Reserva no encontrada o expirada.");
        }
        const spaceId = rows[0].id;

        const updateQuery = `
      UPDATE public.parking_spaces
      SET status = 'occupied',
          reservation_token = NULL,
          reservation_expires = NULL,
          reserved_by = NULL,
          last_updated = NOW()
      WHERE id = $1
      RETURNING *
    `;
        const updated = await client.query(updateQuery, [spaceId]);

        await client.query("COMMIT");
        return updated.rows[0];
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function cancelReservation(zoneId: string, stripIdentifier: string, token: string) {
    const query = `
    UPDATE public.parking_spaces
    SET status = 'free',
        reservation_token = NULL,
        reservation_expires = NULL,
        reserved_by = NULL,
        last_updated = NOW()
    WHERE zone_id = $1
      AND strip_identifier = $2
      AND reservation_token = $3
      AND status = 'reserved'
    RETURNING *
  `;
    const { rows } = await pool.query(query, [zoneId, stripIdentifier, token]);
    if (!rows.length) {
        throw new Error("Reserva no encontrada o ya expirada.");
    }
    return rows[0];
}

export async function getAllZones() {
    const query = `
        SELECT
            z.id AS zone_id,
            z.identifier AS zone_identifier,
            z.name AS zone_name,
            COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS available_spaces,
            COUNT(ps.id) AS total_spaces
        FROM public.zones z
                 LEFT JOIN public.strips s ON z.id = s.zone_id
                 LEFT JOIN public.parking_spaces ps
                           ON s.zone_id = ps.zone_id
                               AND s.strip_identifier = ps.strip_identifier
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

export async function assignParkingSpace(zoneId: string, stripIdentifier: string) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Buscar un espacio libre
        const findQuery = `
            SELECT id
            FROM public.parking_spaces
            WHERE zone_id = $1
              AND strip_identifier = $2
              AND status = 'free'
            LIMIT 1
            FOR UPDATE;
        `;

        const { rows } = await client.query(findQuery, [zoneId, stripIdentifier]);

        if (!rows.length) {
            throw new Error("No hay espacios disponibles.");
        }

        const spaceId = rows[0].id;

        // 2. Marcar como ocupado
        const updateQuery = `
            UPDATE public.parking_spaces
            SET status = 'occupied',
                last_updated = NOW()
            WHERE id = $1
            RETURNING *;
        `;

        const updated = await client.query(updateQuery, [spaceId]);

        await client.query("COMMIT");

        return updated.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}