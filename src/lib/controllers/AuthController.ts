import { Request, Response } from "express";
import { AuthRepository } from "../repositories/AuthRepository";
import {KeyRotationService} from "../services/KeyRotationService";
import {SecretsManagerClient} from "@aws-sdk/client-secrets-manager";
import {AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY, SECRETS_NAME} from "../../config/environment";
import {AwsSecretsManagerService} from "../services/AwsSecretsManagerService";

export class AuthController {
  private static client = new SecretsManagerClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const tokens = await AuthRepository.login(email, password);
      res.json(tokens);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthRepository.refreshToken(refreshToken);
      res.json(tokens);
    } catch (error: any) {
      res.status(403).json({ error: error.message });
    }
  }

  static async revoke(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ ok: false, error: "Token es requerido" });
      }
      const tokens = await AuthRepository.revoke(token);
      res.json(tokens);
    } catch (error: any) {
      res.status(403).json({ error: error.message });
    }
  }

  static async changeCredentials(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId; // Extraído del token JWT
      const { currentPassword, newEmail, newPassword } = req.body;

      const result = await AuthRepository.changeCredentials(userId, currentPassword, newEmail, newPassword);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async forceRotateKey(req: Request, res: Response) {
    try {
      await KeyRotationService.rotateKeys();
      res.json({ ok: true, message: "Key rotation executed successfully" });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  static async revokeAllUserTokens(req: Request, res: Response) {
    try {
      await AuthRepository.revokeAllUserTokens();
      res.json({ ok: true, message: "Tokens revocados para todos los usuarios" });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  static async deleteSecretManager(req: Request, res: Response) {
    try {
      const response = await AuthRepository.deleteSecretManager();
      res.json({ ok: true, message: response.message });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const accessToken = req.header("Authorization")?.replace("Bearer ", "");
      if (!accessToken) {
        res.status(400).json({ error: "Token requerido" });
      }

      await AuthRepository.logout(accessToken as string);
      res.json({ ok: true, message: "Sesión cerrada" });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
}
