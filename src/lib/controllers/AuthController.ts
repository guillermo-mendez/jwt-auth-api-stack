import {Request, Response} from "express";
import {AuthRepository} from "../repositories/AuthRepository";
import {KeyRotationService} from "../services/KeyRotationService";
import {UserRepository} from "../repositories/UserRepository";

export class AuthController {

  static async login(req: Request, res: Response):Promise<any> {
    try {
      const {email, password} = req.body;
      if (!email || !password) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          statusText: "Email y contraseña son requeridos",
          data: null
        });
      }

      const tokens = await AuthRepository.login(email, password);
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: 'Login exitoso',
        data: tokens
      });

    } catch (error: any) {
      return res.status(401).json({ statusCode: 401, success: false, statusText: error.message, data: null });
    }
  }

  static async refreshToken(req: Request, res: Response):Promise<any> {
    try {
      const {refreshToken} = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          statusText: "refreshToken requerido",
          data: null
        });
      }
      const tokens = await AuthRepository.refreshToken(refreshToken);
     return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: 'Token refrescado exitosamente',
        data: tokens
      });

    } catch (error: any) {
      return res.status(403).json({ statusCode: 403, success: false, statusText: error.message, data: null });
    }
  }

  static async revoke(req: Request, res: Response):Promise<any> {
    try {
      const {token} = req.body;
      if (!token) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          statusText: "Token es requerido",
          data: null
        });
      }
      const response = await AuthRepository.revoke(token);
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: response.message,
        data: null
      });

    } catch (error: any) {
      return res.status(403).json({ statusCode: 403, success: false, statusText: error.message, data: null });
    }
  }

  static async changeCredentials(req: Request, res: Response):Promise<any> {
    try {
      const userId = (req as any).userId; // Extraído del token JWT
      const {currentPassword, newEmail, newPassword} = req.body;

      await AuthRepository.changeCredentials(userId, currentPassword, newEmail, newPassword);
      await UserRepository.revokeUserTokens(userId);

      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: 'Credenciales cambiadas exitosamente',
        data: null
      });

    } catch (error: any) {
      return res.status(400).json({ statusCode: 400, success: false, statusText: error.message, data: null });
    }
  }

  static async forceRotateKey(req: Request, res: Response):Promise<any> {
    try {
      const response = await KeyRotationService.rotateKeys();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText:response.message,
        data: null
      });

    } catch (error: any) {
      return res.status(500).json({ statusCode: 500, success: false, statusText: error.message, data: null });
    }
  }

  static async revokeAllUserTokens(req: Request, res: Response):Promise<any> {
    try {
      const response = await AuthRepository.revokeAllUserTokens();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: response.message,
        data: null
      });

    } catch (error: any) {
      return res.status(500).json({ statusCode: 500, success: false, statusText: error.message, data: null });
    }
  }

  static async deleteSecretManager(req: Request, res: Response):Promise<any> {
    try {
      const response = await AuthRepository.deleteSecretManager();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: response.message,
        data: null
      });

    } catch (error: any) {
      return res.status(500).json({ statusCode: 500, success: false, statusText: error.message, data: null });
    }
  }

  static async logout(req: Request, res: Response):Promise<any> {
    try {
      const accessToken = req.header("Authorization")?.replace("Bearer ", "");
      if (!accessToken) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          statusText: "Token requerido",
          data: null
        });
      }

      const response = await AuthRepository.logout(accessToken as string);
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: response.message,
        data: null
      });

    } catch (error: any) {
      return res.status(500).json({ statusCode: 500, success: false, statusText: error.message, data: null });
    }
  }
}
