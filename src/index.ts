import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
import parkingRoutes from "./routes/parkingRoutes";
import {testDatabaseConnection} from "./config/db";
import dotenv from "dotenv";
import {corsConfig} from "./config/corsConfig";

dotenv.config();

const app = express();

// Configuraciones
app.use(express.json());
app.set('port', process.env.PORT ?? 3000);
app.set('json spaces', 2);

// Middleware
app.use(cors(corsConfig));
// Este es el endpoint del API
app.use("/parkings", parkingRoutes);

// Opciones de configuración HTTPS
// const options = {
//     key: fs.readFileSync('/etc/letsencrypt/live/dastic.brazilsouth.cloudapp.azure.com/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/dastic.brazilsouth.cloudapp.azure.com/fullchain.pem')
// };

const options = {
    key: fs.readFileSync('./src/certificados/clave-privada.key'),
    cert: fs.readFileSync('./src/certificados/certificado-firmado.crt')
};


// Iniciar servidor HTTPS
https.createServer(options, app).listen(app.get('port'), () => {
    console.log(`Server listening on port ${app.get('port')} (HTTPS)`);
    testDatabaseConnection().then();
});

