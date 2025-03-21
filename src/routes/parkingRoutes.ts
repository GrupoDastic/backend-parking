import {Router} from "express";
import {QueryResult} from "pg";
import {Request, Response} from "express";
import {pool} from "../config/db";
import createPattern from "../questions/create_pathern";
import readNumber from "../questions/read_number";
import {recognizeQuestionPattern} from "../questions/questions_recognition";
import questionsReplies from "../questions/questions_responser";

const router = Router();

router.get("/request", (req: Request, res: Response) => {
    const text = typeof req.query.text === 'string' ? req.query.text : '';

    let pattern = createPattern(text);
    let number: number | null = readNumber(text);
    let question = recognizeQuestionPattern(pattern);

    let query;
    let parameter = [];
    switch (question) {
        case "cm1":
            query = "SELECT * FROM parqueos WHERE estado=0";
            break;
        case "cm2":
            query = "SELECT DISTINCT id_zona FROM parqueos WHERE estado=0";
            break;
        case "cm3":
            query = "";
            break;
        case "cm4":
        case "cm6":
            query = "SELECT * FROM parqueos WHERE id_parqueadero=$1";
            parameter.push(number);
            break;
        case "cm5":
            query = "SELECT * FROM parqueos WHERE estado=0 AND id_zona=$1";
            parameter.push(number);
            break;
        case "cm7":
            query = "";
            break;
        case "cm8":
            query = "";
            break;
        case "cm9":
            query = "";
            break;
        default:
            query = "";
            break;
    }

    pool.query(query, parameter, (error: Error, results: QueryResult) => {
        if (error) {
            throw error;
            //{"text":"Server error"}
        }
        let responseJson = questionsReplies(question, number, results.rows);
        res.status(200).json(responseJson);
    });
})

router.get("/zones", async (req, res) => {
    try {
        const query = `
            SELECT z.id AS zone_id, z.name AS zone_name,
                   COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS available_spaces
            FROM public.zones z
            LEFT JOIN public.strips s ON z.id = s.zone_id
            LEFT JOIN public.parking_spaces ps ON s.id = ps.strip_id
            GROUP BY z.id, z.name;
        `;
        const result = await pool.query(query);
        res.json({ zones: result.rows });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/zones/:zoneId/strips", async (req, res) => {
    const { zoneId } = req.params;

    try {
        // Consulta para obtener los strips y el conteo de espacios libres
        const query = `
            SELECT
                s.id AS strip_id,
                s.name AS strip_name,
                COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS free_spaces
            FROM public.strips s
                     LEFT JOIN public.parking_spaces ps ON s.id = ps.strip_id
            WHERE s.zone_id = $1
            GROUP BY s.id, s.name;
        `;

        // Ejecutar la consulta
        const result = await pool.query(query, [zoneId]);

        // Respuesta con los datos obtenidos
        res.status(200).json({
            zone_id: zoneId,
            strips: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Obtener los parqueaderos de un strip específico
router.get("/strips/:stripId/parking-spaces", async (req, res) => {
    const { stripId } = req.params;
    try {
        const query = `
            SELECT ps.id AS parking_space_id, ps.identifier, ps.type, ps.status, ps.number, ps.plate, ps.last_updated
            FROM public.parking_spaces ps
            WHERE ps.strip_id = $1;
        `;
        const result = await pool.query(query, [stripId]);
        res.json({ parking_spaces: result.rows });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});


// Obtener toda la información de los parking_spaces y el conteo de espacios libres en un strip específico
router.get("/zones/:zoneId/strips/:stripId/parking-spaces", async (req: Request, res: Response) => {
    const { zoneId, stripId } = req.params;

    try {
        // Consulta para obtener toda la información de los parking_spaces en el strip específico
        const parkingSpacesQuery = `
            SELECT ps.id, ps.strip_id, ps.identifier, ps.type, ps.status, ps.number, ps.plate, ps.last_updated
            FROM public.parking_spaces ps
            JOIN public.strips s ON ps.strip_id = s.id
            WHERE s.zone_id = $1 AND s.id = $2;
        `;

        // Consulta para contar los espacios libres en el strip específico
        const freeSpacesCountQuery = `
            SELECT COUNT(ps.id) AS free_spaces
            FROM public.parking_spaces ps
            JOIN public.strips s ON ps.strip_id = s.id
            WHERE ps.status = 'free' AND s.zone_id = $1 AND s.id = $2;
        `;

        // Ejecutar ambas consultas
        const parkingSpacesResult = await pool.query(parkingSpacesQuery, [zoneId, stripId]);
        const freeSpacesCountResult = await pool.query(freeSpacesCountQuery, [zoneId, stripId]);

        // Respuesta con los datos obtenidos
        res.status(200).json({
            zone_id: zoneId,
            strip_id: stripId,
            parking_spaces: parkingSpacesResult.rows,
            free_spaces: freeSpacesCountResult.rows[0].free_spaces
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});



// Obtener los strips de una zona específica con todos sus parqueaderos
router.get("/zones/:zoneId/strips-with-parking", async (req, res) => {
    const { zoneId } = req.params;
    try {
        const query = `
            SELECT s.id AS strip_id, s.name AS strip_name,
                   json_agg(
                       json_build_object(
                           'parking_space_id', ps.id,
                           'identifier', ps.identifier,
                           'type', ps.type,
                           'status', ps.status,
                           'number', ps.number,
                           'plate', ps.plate,
                           'last_updated', ps.last_updated
                       )
                   ) AS parking_spaces
            FROM public.strips s
            LEFT JOIN public.parking_spaces ps ON s.id = ps.strip_id
            WHERE s.zone_id = $1
            GROUP BY s.id, s.name;
        `;
        const result = await pool.query(query, [zoneId]);
        res.json({ strips: result.rows });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Obtener todos los parqueaderos de una zona específica incluyendo la información de los strips
router.get("/zones/:zoneId/parking-spaces", async (req, res) => {
    const { zoneId } = req.params;
    try {
        const query = `
            SELECT s.id AS strip_id, s.name AS strip_name,
                   json_agg(
                       json_build_object(
                           'parking_space_id', ps.id,
                           'identifier', ps.identifier,
                           'type', ps.type,
                           'status', ps.status,
                           'number', ps.number,
                           'plate', ps.plate,
                           'last_updated', ps.last_updated
                       )
                   ) AS parking_spaces
            FROM public.strips s
            LEFT JOIN public.parking_spaces ps ON s.id = ps.strip_id
            WHERE s.zone_id = $1
            GROUP BY s.id, s.name;
        `;
        const result = await pool.query(query, [zoneId]);
        res.json({ zone_id: zoneId, strips: result.rows });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Obtener los parqueaderos de un strip específico
router.get("/strips/:stripId/parking-spaces", async (req, res) => {
    const { stripId } = req.params;
    try {
        const query = `
            SELECT ps.id AS parking_space_id, ps.identifier, ps.type, ps.status, ps.number, ps.plate, ps.last_updated
            FROM public.parking_spaces ps
            WHERE ps.strip_id = $1;
        `;
        const result = await pool.query(query, [stripId]);
        res.json({ parking_spaces: result.rows });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// router.get("/voice-command", (req, res) => {
//     const { text } = req.body;
//     if (!text) {
//         return res.status(400).json({ error: "No text provided" });
//     }
//
//     try {
//         const question = recognizeQuestionPattern(text);
//         let query = "";
//         let parameters = [];
//
//         switch (question) {
//             case "cm1":
//                 query = "SELECT * FROM public.parking_spaces WHERE status = 'free'";
//                 break;
//             case "cm2":
//                 query = "SELECT DISTINCT z.id AS zone_id, z.name AS zone_name FROM public.zones z JOIN public.strips s ON z.id = s.zone_id JOIN public.parking_spaces ps ON s.id = ps.strip_id WHERE ps.status = 'free'";
//                 break;
//             case "cm4":
//                 query = "SELECT * FROM public.parking_spaces WHERE id = $1";
//                 parameters.push(text.match(/\d+/g)?.[0]);
//                 break;
//             case "cm5":
//                 query = "SELECT * FROM public.parking_spaces WHERE status = 'free' AND strip_id = $1";
//                 parameters.push(text.match(/\d+/g)?.[0]);
//                 break;
//             default:
//                 return res.json({ text: "No entendí la consulta, intenta de nuevo." });
//         }
//
//         const result = await pool.query(query, parameters);
//         const response = questionsReplies(question, parameters[0] || null, result.rows);
//         res.json(response);
//     } catch (error) {
//         res.status(500).json({ error: "Server error" });
//     }
// });


export default router;
