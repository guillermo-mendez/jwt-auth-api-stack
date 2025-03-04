import express from "express";
import { AuthController } from "../controllers/AuthController";

const router = express.Router();

router.post("/rotate-key", AuthController.forceRotateKey);
router.post("/revoke-all-tokens", AuthController.revokeAllUserTokens);
router.delete("/delete-secret-manager", AuthController.deleteSecretManager);

export default router;