import express, {Request, Response} from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import {recogniceQuestionsPathern} from "./questions_recognition";

import {QueryResult} from "pg";
import questionsResponser from "./questions_responser";
import readNumber from "./read_number";
import createPathern from "./create_pathern";

const app = express();
const Pool = require('pg').Pool;

dotenv.config();

// Configuraciones
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({origin: '*', methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']}));

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: String(process.env.POSTGRES_PASSWORD),
    ssl: {
        rejectUnauthorized: false
    }
});

// Este es el endpoint del API
app.get('/parkings/request', (request: Request, response: Response) => {

    const text = typeof request.query.text === 'string' ? request.query.text : '';

    let pathern = createPathern(text);
    let number: number = readNumber(text) ?? 0;
    let question = recogniceQuestionsPathern(pathern);

    let query = "";
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
            query = "SELECT * FROM parqueos WHERE id_parqueadero=$1";
            parameter.push(number);
            break;
        case "cm5":
            query = "SELECT * FROM parqueos WHERE estado=0 AND id_zona=$1";
            parameter.push(number);
            break;
        case "cm6":
            query = "SELECT * FROM parqueos WHERE id_parqueadero=$1";
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
        console.log(results.rows);
        let responseJson = questionsResponser(question, number, results.rows);
        console.log(responseJson);
        response.status(200).json(responseJson);
    });
});

// Opciones de configuración HTTPS
// const options = {
//     key: fs.readFileSync('/etc/letsencrypt/live/dastic.brazilsouth.cloudapp.azure.com/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/dastic.brazilsouth.cloudapp.azure.com/fullchain.pem')
// };

const options = {
    key: fs.readFileSync('./src/certificados/clave-privada.key'),
    cert: fs.readFileSync('./src/certificados/certificado-firmado.crt')
};

async function testDatabaseConnection() {
    try {
        const client = await pool.connect();
        console.log("✅ Connected to the database successfully!");
        client.release(); // Release connection back to the pool
    } catch (error) {
        console.error("❌ Error connecting to the database:", error);
    }
}


// Iniciar servidor HTTPS
https.createServer(options, app).listen(app.get('port'), () => {
    console.log(`Server listening on port ${app.get('port')} (HTTP)`);
    testDatabaseConnection();
});
//app.listen(app.get('port'),()=>{
//    console.log(`Server listening on port ${app.get('port')}`);
//});
