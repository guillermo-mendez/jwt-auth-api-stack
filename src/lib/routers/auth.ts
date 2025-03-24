import express from "express";
import { AuthController } from "../controllers/AuthController";

const router = express.Router();

router.post("/login", AuthController.login);
router.post("/refreshToken", AuthController.refreshToken);
router.post("/revoke", AuthController.revoke);
router.post("/logout", AuthController.logout);
router.put("/change-credentials", AuthController.changeCredentials);

export default router;