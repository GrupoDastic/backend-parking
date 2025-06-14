import express from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
import parkingRoutes from "./routes/parkingRoutes";
import dotenv from "dotenv";
import {corsConfig} from "./config/corsConfig";

dotenv.config();

const app = express();

app.use(express.json());
app.set('port', process.env.PORT ?? 3000);
app.set('json spaces', 2);

app.use(cors(corsConfig));
app.use("/parkings", parkingRoutes);

const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/dastic.brazilsouth.cloudapp.azure.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/dastic.brazilsouth.cloudapp.azure.com/fullchain.pem')
};

https.createServer(options, app).listen(app.get('port'), () => {
    console.log(`Server listening on port ${app.get('port')} (HTTPS)`);
});

