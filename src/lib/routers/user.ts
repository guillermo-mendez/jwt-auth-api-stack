import express from 'express';
import { UserController } from '../controllers/UserController';
const router = express.Router();


router.get("/", UserController.getUsers);
router.get("/:userId", UserController.getUserByUserId);
router.post("/register", UserController.registerUser);
router.post("/revoke-tokens", UserController.revokeUserTokens);
router.put("/update/:userId", UserController.updateUser);
router.delete("/delete/:userId", UserController.deleteUser);

export default router;