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

export default router;
