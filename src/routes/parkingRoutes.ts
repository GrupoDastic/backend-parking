import { Router } from "express";
import {
    getAllZones,
    getStripsByZone,
    getParkingSpacesByStrip,
    getStripMap,
    assignParkingSpace, cancelReservation, confirmReservation, createReservation
} from "../services/zoneService";
import { handleError, validateParams } from "../utils/helpers";

const router = Router();

router.get("/zones", async (req, res) => {
    try {
        const zones = await getAllZones();
        res.json({ zones });
    } catch (error) {
        handleError(res, error);
    }
});

router.get("/zones/:zoneId/strips", validateParams(["zoneId"]), async (req, res) => {
    try {
        const { zoneId } = req.params;
        const strips = await getStripsByZone(zoneId);
        res.json({ strips });
    } catch (error) {
        handleError(res, error);
    }
});

router.get("/zones/:zoneId/strips/:stripIdentifier/parking-spaces", validateParams(["zoneId", "stripIdentifier"]), async (req, res) => {
    try {
        const { zoneId, stripIdentifier } = req.params;
        const { spaces, freeCount } = await getParkingSpacesByStrip(zoneId, stripIdentifier);

        res.json({
            zone_id: String(zoneId),
            strip_identifier: String(stripIdentifier),
            parking_spaces: spaces,
            free_spaces: String(freeCount ?? "0"),
        });
    } catch (error) {
        handleError(res, error);
    }
});


router.get("/zones/:zoneId/strips/:stripIdentifier/map", validateParams(["zoneId", "stripIdentifier"]), async (req, res) => {
    try {
        const { zoneId, stripIdentifier } = req.params;
        const map = await getStripMap(zoneId, stripIdentifier);
        res.json({ map });
    } catch (error) {
        handleError(res, error);
    }
});

export default router;

router.post(
    "/zones/:zoneId/strips/:stripIdentifier/assign",
    validateParams(["zoneId", "stripIdentifier"]),
    async (req, res) => {
        try {
            const { zoneId, stripIdentifier } = req.params;

            const space = await assignParkingSpace(zoneId, stripIdentifier);

            res.json({
                message: "Espacio asignado correctamente",
                parking_space: space,
            });
        } catch (error) {
            handleError(res, error);
        }
    }
);

router.post(
    "/zones/:zoneId/strips/:stripIdentifier/reserve",
    validateParams(["zoneId", "stripIdentifier"]),
    async (req, res) => {
        try {
            const { zoneId, stripIdentifier } = req.params;
            const { spaceId } = req.body;

            const reservation = await createReservation(
                zoneId,
                stripIdentifier,
                spaceId
            );

            res.json({ success: true, ...reservation });
        } catch (error) {
            handleError(res, error);
        }
    }
);

router.post("/zones/:zoneId/strips/:stripIdentifier/confirm", validateParams(["zoneId", "stripIdentifier"]), async (req, res) => {
    try {
        const { zoneId, stripIdentifier } = req.params;
        const { token } = req.body;
        const space = await confirmReservation(zoneId, stripIdentifier, token);
        res.json({ success: true, parking_space: space });
    } catch (error) {
        handleError(res, error);
    }
});

router.post("/zones/:zoneId/strips/:stripIdentifier/cancel", validateParams(["zoneId", "stripIdentifier"]), async (req, res) => {
    try {
        const { zoneId, stripIdentifier } = req.params;
        const { token } = req.body;
        const space = await cancelReservation(zoneId, stripIdentifier, token);
        res.json({ success: true, parking_space: space });
    } catch (error) {
        handleError(res, error);
    }
});