import express from 'express';
import cors from 'cors';
import parkingRoutes from "./routes/parkingRoutes";
import dotenv from "dotenv";
import {corsConfig} from "./config/corsConfig";
import cameraRoutes from "./routes/cameraRoutes";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.text({type: "*/*"}));
app.set('port', process.env.PORT ?? 3000);
app.set('json spaces', 2);

app.use(cors(corsConfig));
app.use("/", parkingRoutes);
app.use("/", cameraRoutes);

app.listen(app.get('port'), () => {
    console.log(`Server listening on port ${app.get('port')} (HTTP)`);
});

