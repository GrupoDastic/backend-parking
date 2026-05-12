import {pool} from "../config/db";

export async function processCameraEvent(data: any) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 🔥 limpiar reservas expiradas
        await client.query(`
            UPDATE parking_spaces
            SET status = 'free',
                reservation_token = NULL,
                reservation_expires = NULL
            WHERE status = 'reserved'
              AND reservation_expires < NOW()
        `);

        const spaces = data.PackingSpaceRecognition;

        const occupied: number[] = [];
        const free: number[] = [];

        for (const space of spaces) {
            const number = parseInt(space.absoulteParkingNum);

            if (space.isParked === "yes") {
                occupied.push(number);
            } else {
                free.push(number);
            }
        }

        // 🔥 UPDATE OCUPADOS (batch)
        if (occupied.length > 0) {
            await client.query(
                `
                UPDATE parking_spaces
                SET status = 'occupied',
                    reservation_token = NULL,
                    reservation_expires = NULL,
                    last_updated = NOW()
                WHERE number = ANY($1)
                `,
                [occupied]
            );
        }

        // 🔥 UPDATE LIBRES (batch)
        if (free.length > 0) {
            await client.query(
                `
                UPDATE parking_spaces
                SET status = 'free',
                    last_updated = NOW()
                WHERE number = ANY($1)
                  AND (
                        status != 'reserved'
                        OR reservation_expires < NOW()
                  )
                `,
                [free]
            );
        }

        await client.query("COMMIT");

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}