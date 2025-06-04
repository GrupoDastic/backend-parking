import {NextFunction, Request, Response, Router} from "express";
import {pool} from "../config/db";
import createPattern from "../questions/create_pathern";
import {recognizeQuestionPattern} from "../questions/questions_recognition";
import questionsReplies from "../questions/questions_responser";

const router = Router();

router.get("/speech", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const text = typeof req.query.text === "string" ? req.query.text : "";
        const pattern = createPattern(text);
        const numbers = text.match(/\d+/g)?.map(Number) || [];
        const question = recognizeQuestionPattern(pattern);
        console.log("Pregunta reconocida:", question);
        let query = "";
        let parameters: any[] = [];

        switch (question) {
            case "cm1": // 🚀 Disponibilidad de parqueaderos en cualquier zona
                query = `
                    SELECT ps.id,
                           ps.identifier,
                           ps.type,
                           ps.status,
                           ps.number,
                           z.id         AS zone_id,
                           z.identifier AS zone_identifier,
                           z.name       AS zone_name,
                           s.strip_identifier,
                           s.name       AS strip_name
                    FROM parking_spaces ps
                             JOIN strips s ON ps.zone_id = s.zone_id AND ps.strip_identifier = s.strip_identifier
                             JOIN zones z ON ps.zone_id = z.id
                    WHERE ps.status = 'free'
                      AND ps.type = 'common'
                    LIMIT 3;
                `;
                break;

            case "cm2":
                query = `
                    SELECT DISTINCT z.id AS zone_id, z.identifier, z.name
                    FROM zones z
                             JOIN strips s ON z.id = s.zone_id
                             JOIN parking_spaces ps
                                  ON s.zone_id = ps.zone_id AND s.strip_identifier = ps.strip_identifier
                    WHERE ps.status = 'free'
                `;
                break;

            case "cm4": // 🚀 Disponibilidad de un parqueadero específico
                if (numbers.length < 1) {
                    res.status(400).json({text: "Debe proporcionar el número de un parqueadero."});
                    return;
                }
                query = `
                    SELECT id, identifier, type, status, zone_id, strip_identifier
                    FROM parking_spaces
                    WHERE id = $1;
                `;
                parameters.push(numbers[0]);
                break;
            case "cm6":
                if (numbers.length < 1) {
                    res.status(400).json({text: "Debe proporcionar un número de parqueadero válido."});
                    return;
                }
                query = "SELECT * FROM parking_spaces WHERE id = $1";
                parameters.push(numbers[0]);
                break;

            case "cm5": // 🚀 Disponibilidad en una zona específica
                if (numbers.length < 1) {
                    res.status(400).json({text: "Debe proporcionar una zona válida."});
                    return;
                }
                query = `
                    SELECT ps.id,
                           ps.identifier,
                           ps.type,
                           ps.status,
                           ps.number,
                           z.id         AS zone_id,
                           z.identifier AS zone_identifier,
                           z.name       AS zone_name,
                           s.strip_identifier,
                           s.name       AS strip_name
                    FROM parking_spaces ps
                             JOIN strips s ON ps.zone_id = s.zone_id AND ps.strip_identifier = s.strip_identifier
                             JOIN zones z ON ps.zone_id = z.id
                    WHERE ps.status = 'free'
                      AND ps.zone_id = $1;
                `;
                parameters.push(numbers[0]);
                break;

            case "cm10":
                if (numbers.length < 1) {
                    res.status(400).json({text: "Debe proporcionar una zona válida."});
                    return;
                }
                query = `
                    SELECT s.zone_id,
                           s.strip_identifier,
                           s.name                                         AS strip_name,
                           COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS free_spaces
                    FROM strips s
                             LEFT JOIN parking_spaces ps
                                       ON s.zone_id = ps.zone_id AND s.strip_identifier = ps.strip_identifier
                    WHERE s.zone_id = $1
                    GROUP BY s.zone_id, s.strip_identifier, s.name;
                `;
                parameters.push(numbers[0]);
                break;

            case "cm11": // 🚀 Parqueaderos en una franja dentro de una zona
                if (numbers.length < 2) {
                    res.status(400).json({text: "Debe proporcionar una zona y una franja válidas."});
                    return;
                }
                query = `
                    SELECT ps.id,
                           ps.identifier,
                           ps.type,
                           ps.status,
                           ps.number,
                           z.id         AS zone_id,
                           z.identifier AS zone_identifier,
                           z.name       AS zone_name,
                           s.strip_identifier,
                           s.name       AS strip_name
                    FROM parking_spaces ps
                             JOIN strips s ON ps.zone_id = s.zone_id AND ps.strip_identifier = s.strip_identifier
                             JOIN zones z ON ps.zone_id = z.id
                    WHERE ps.zone_id = $1
                      AND ps.strip_identifier = $2
                      AND ps.status = 'free';
                `;
                parameters.push(numbers[0], numbers[1]);
                break;

            case "cm7":
            case "cm8":
            case "cm9":
                res.status(200).json({text: "Este comando aún no está implementado."});
                return;

            default:
                res.status(400).json({text: "No entendí la consulta, intenta de nuevo."});
                return;
        }

        const result = await pool.query(query, parameters);
        const responseJson = questionsReplies(question, numbers[0] || null, result.rows);
        res.status(200).json(responseJson);

    } catch (error) {
        console.error("Error en /speech:", error);
        next(error); // ✅ Manejamos el error correctamente
    }
});
;

// ✅ Obtener todas las zonas con conteo de espacios libres
router.get("/zones", async (req, res) => {
    try {
        const query = `
            SELECT z.id                                           AS zone_id,
                   z.identifier                                   AS zone_identifier,
                   z.name                                         AS zone_name,
                   COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS available_spaces
            FROM public.zones z
                     LEFT JOIN public.strips s ON z.id = s.zone_id
                     LEFT JOIN public.parking_spaces ps
                               ON s.zone_id = ps.zone_id AND s.strip_identifier = ps.strip_identifier
            GROUP BY z.id;
        `;
        const result = await pool.query(query);
        res.json({zones: result.rows});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Server error"});
    }
});

// ✅ Obtener strips de una zona específica
router.get("/zones/:zoneId/strips", async (req, res) => {
    const {zoneId} = req.params;
    try {
        const query = `
            SELECT s.zone_id,
                   s.strip_identifier,
                   s.name                                         AS strip_name,
                   COUNT(ps.id) FILTER (WHERE ps.status = 'free') AS free_spaces
            FROM public.strips s
                     LEFT JOIN public.parking_spaces ps
                               ON s.zone_id = ps.zone_id AND s.strip_identifier = ps.strip_identifier
            WHERE s.zone_id = $1
            GROUP BY s.zone_id, s.strip_identifier, s.name;
        `;
        const result = await pool.query(query, [zoneId]);
        res.json({strips: result.rows});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Server error"});
    }
});


// ✅ Obtener todos los parqueaderos de un strip específico
router.get("/zones/:zoneId/strips/:stripIdentifier/parking-spaces", async (req, res) => {
    const {zoneId, stripIdentifier} = req.params;
    try {
        const query = `
            SELECT ps.id,
                   ps.identifier,
                   ps.type,
                   ps.status,
                   ps.number,
                   ps.last_updated,
                   ps.position_x,
                   ps.position_y,
                   ps.orientation,
                   ps.rotation,
                   ps.coordinates
            FROM public.parking_spaces ps
            WHERE ps.zone_id = $1
              AND ps.strip_identifier = $2;
        `;

        const parkingSpacesQuery = `
            SELECT COUNT(ps.id) AS free_spaces
            FROM public.parking_spaces ps
            WHERE ps.status = 'free'
              AND ps.zone_id = $1
              AND ps.strip_identifier = $2;
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
        res.status(500).json({error: "Server error"});
    }
});

router.get("/zones/:zoneId/strips/:stripIdentifier/map", async (req, res) => {
    const {zoneId, stripIdentifier} = req.params;
    try {
        const query = `
            SELECT sm.zone_id,
                   sm.strip_identifier,
                   sm.svg_content,
                   sm.width,
                   sm.height,
                   sm.viewbox
            FROM public.strip_maps sm
            WHERE sm.zone_id = $1
              AND sm.strip_identifier = $2;
        `;

        const result = await pool.query(query, [zoneId, stripIdentifier]);

        res.json({
            map: result.rows,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Server error"});
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
