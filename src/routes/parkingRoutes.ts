import { Router } from "express";
import { getAllZones, getStripsByZone, getParkingSpacesByStrip, getStripMap } from "../services/zoneService";
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
