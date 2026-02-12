import express from "express";
import { getLatestGeneralPermission, enableGeneralPermission } from "../controllers/generalPermissionController.js";

const router = express.Router();

// GET latest general permission
router.get("/latest", getLatestGeneralPermission);

// POST to enable/update GP
router.post("/", enableGeneralPermission);

export default router;
