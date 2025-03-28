import {Router} from "express";
import {QueryResult} from "pg";
import {Request, Response} from "express";
import {pool} from "../config/db";
import createPattern from "../questions/create_pathern";
import readNumber from "../questions/read_number";
import {recognizeQuestionPattern} from "../questions/questions_recognition";
import questionsReplies from "../questions/questions_responser";

const router = Router();

router.get("/speech", (req: Request, res: Response) => {
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

// ✅ Obtener todas las zonas con conteo de espacios libres
router.get("/zones", async (req, res) => {
    try {
        const query = `
            SELECT z.id AS zone_id, z.identifier AS zone_identifier, z.name AS zone_name,
                   COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS available_spaces
            FROM public.zones z
                     LEFT JOIN public.strips s ON z.id = s.zone_id
                     LEFT JOIN public.parking_spaces ps ON s.zone_id = ps.zone_id AND s.strip_identifier = ps.strip_identifier
            GROUP BY z.id;
        `;
        const result = await pool.query(query);
        res.json({ zones: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Obtener strips de una zona específica
router.get("/zones/:zoneId/strips", async (req, res) => {
    const { zoneId } = req.params;
    try {
        const query = `
            SELECT s.zone_id, s.strip_identifier, s.name AS strip_name,
                   COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS free_spaces
            FROM public.strips s
                     LEFT JOIN public.parking_spaces ps ON s.zone_id = ps.zone_id AND s.strip_identifier = ps.strip_identifier
            WHERE s.zone_id = $1
            GROUP BY s.zone_id, s.strip_identifier, s.name;
        `;
        const result = await pool.query(query, [zoneId]);
        res.json({ strips: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});


// ✅ Obtener todos los parqueaderos de un strip específico
router.get("/zones/:zoneId/strips/:stripIdentifier/parking-spaces", async (req, res) => {
    const { zoneId, stripIdentifier } = req.params;
    try {
        const query = `
            SELECT ps.id, ps.identifier, ps.type, ps.status, ps.number, ps.plate, ps.last_updated, ps.position_x, ps.position_y, ps.orientation
            FROM public.parking_spaces ps
            WHERE ps.zone_id = $1 AND ps.strip_identifier = $2;
        `;

        const parkingSpacesQuery = `
            SELECT COUNT(ps.id) AS free_spaces
            FROM public.parking_spaces ps
            WHERE ps.status = 'free' AND ps.zone_id = $1 AND ps.strip_identifier = $2;
        `;

        const result = await pool.query(query, [zoneId, stripIdentifier]);
        const freeSpacesCountResult = await pool.query(parkingSpacesQuery, [zoneId, stripIdentifier]);

        res.json({
            zone_id: zoneId,
            strip_identifier: stripIdentifier,
            parking_spaces: result.rows,
            free_spaces: freeSpacesCountResult.rows[0].free_spaces
        });

    } catch (error) {
        console.error(error);
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
