import { Router } from "express";
import {processCameraEvent} from "../services/cameraService";

const router = Router();

router.post("/camera/events", async (req, res): Promise<void> => {
    console.log("📸 Received camera event");
    console.log("📸 Headers:", req.headers);
    console.log("📸 Body:", req.body);
    try {
        console.log("🔥 HIT CAMERA");

        const raw = req.body.toString();

        // 🔥 extraer JSON
        const match = raw.match(/\{[\s\S]*\}/);

        if (!match) {
            console.log("❌ NO JSON");
            res.status(400).json({ error: "No JSON found" });
            return;
        }

        const data = JSON.parse(match[0]);

        console.log("✅ EVENT:", data.triggerType);

        if (!data.PackingSpaceRecognition) {
            res.status(400).json({ error: "Invalid structure" });
            return;
        }

        console.log("📊 Parking spaces detected:", data.PackingSpaceRecognition.length);

        await processCameraEvent(data);

        console.log("✅ PROCESSED");

    } catch (error) {
        console.error("Camera error:", error);
        res.status(500).json({ ok: false });
    }
});

export default router;