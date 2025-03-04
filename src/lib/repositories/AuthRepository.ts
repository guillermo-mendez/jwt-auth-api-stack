import bcrypt from "bcryptjs";
import User, {IUser} from "../../models/User";
import Session from "../../models/Session";
import {TokenService} from '../services/TokenService'
import {UserRepository} from "./UserRepository";
import {IGenerateTokensResponse} from "../../entities/BuildTokens";
import {isTokenRevoked, revokeToken} from "./TokenRevocationRepository";
import {DeleteSecretCommand} from "@aws-sdk/client-secrets-manager";
import {SECRETS_NAME} from "../../config/environment";
import {AwsSecretsManagerConfigService} from "../services/AwsSecretsManagerConfigService";

/**
 * Servicio de autenticación que genera y descifra tokens JWE usando
 * RSA-OAEP (alg) y A256GCM (enc).
 */
export class AuthRepository {


  static async login(email: string, password: string): Promise<IGenerateTokensResponse> {
    const user = await UserRepository.getUserByEmail(email);
    if (!user) throw new Error("Credenciales incorrectas");

    // Comparar contraseñas
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Credenciales inválidas (password incorrecto)");
    }

    // Extraer informacion del usuario
    const userId = user._id.toString() || '';
    const username = `${user.firstName || ''} ${user.lastName || ''}`;
    const role = user.role || '';
    const tokenVersion = user.tokenVersion;

    // Generar tokens
    const accessTokenData = await TokenService.generateJweAccessToken({userId, email, username, role, tokenVersion});
    const refreshTokenData = await TokenService.generateJweRefreshToken({userId, tokenVersion});

    // Guardar sesión
    await Session.create({
      userId: user._id,
      accessToken: accessTokenData.accessToken,
      expiresAt: accessTokenData.expiresIn
    });

    return {
      tokens: {
        accessToken: accessTokenData.accessToken,
        refreshToken: refreshTokenData.refreshToken,
        exp: accessTokenData.expiresIn,
        tokenType: 'Bearer',
      },
      role,
      username,
      email
    }
  }

  static async refreshToken(refreshToken: string) {
    try {
      // Descifra el refresh token
      const payload = await TokenService.decryptJweToken(refreshToken);

      // Verificar que el token no esté revocado
      if (payload.jti && await isTokenRevoked(payload.jti as string)) {
        throw new Error("Refresh token revocado");
      }

      // Generar un nuevo Access Token
      const accessTokenData = await TokenService.generateJweAccessToken({
        userId: payload.userId,
        email: payload.email,
        username: payload.username,
        role: payload.role,
      });

      return {
        accessToken: accessTokenData.accessToken,
        exp: accessTokenData.expiresIn,
        tokenType: 'Bearer',
      }

    } catch (error: any) {
      throw new Error(error.message);
    }

  }

  static async revoke(token: string) {
    try {
       // Para un token encriptado (JWE) debemos descifrarlo para extraer el jti y exp.
      // Usa tu método de descifrado. Aquí se asume que AuthService.decryptJweToken() devuelve el payload.
      const payload = await TokenService.decryptJweToken(token);

      // Asegurarse de que el payload contiene jti y exp
      if (!payload.jti || !payload.exp) {
        return { ok: false, error: "El token no contiene 'jti' o 'exp'" };
      }

      // Revocar el token: guarda el jti y exp en la base de datos
      await revokeToken(payload.jti as string, payload.exp as number);

      return { ok: true, message: "Token revocado manualmente" };
    } catch (error: any) {
      throw new Error(error.message);
    }

  }

  static async changeCredentials(userId: string, currentPassword: string, newEmail?: string, newPassword?: string) {
    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Contraseña actual incorrecta");

    // Verificar si el nuevo email ya está en uso por otro usuario
    if (newEmail) {
      const existingUser = await User.findOne({email: newEmail, _id: {$ne: userId}});
      if (existingUser) throw new Error("El email ya está en uso");
      user.email = newEmail;
    }

    // Hashear y actualizar la nueva contraseña (si se proporciona)
    if (newPassword) {
      await user.save(); // Guardar los cambios
    } else if (newEmail) {
      await User.findByIdAndUpdate(userId, {email: newEmail}, {new: true});
    }

    // Invalidar sesiones activas si cambió la contraseña
    if (newPassword) {
      await Session.deleteMany({userId});
    }

    return {message: "Credenciales actualizadas correctamente"};
  }

  /**
   * Revoca los tokens de todos los usuarios incrementando el campo tokenVersion en cada documento.
   * Todos los tokens emitidos con la versión anterior serán inválidos.
   */
  static async revokeAllUserTokens() {
    await User.updateMany({}, { $inc: { tokenVersion: 1 } });
    console.log("Tokens revocados para todos los usuarios.");
  }

  /**
   * Revoca los tokens de todos los usuarios incrementando el campo tokenVersion en cada documento.
   * Todos los tokens emitidos con la versión anterior serán inválidos.
   */
  static async deleteSecretManager() {
    const client =AwsSecretsManagerConfigService.getClient();
    const command = new DeleteSecretCommand({
      SecretId: SECRETS_NAME,
      ForceDeleteWithoutRecovery: true // Elimina inmediatamente sin período de recuperación
    });
    await client.send(command);
    console.log(`Secreto ${SECRETS_NAME} eliminado correctamente.`);
    return {message: `Secreto ${SECRETS_NAME} eliminado correctamente.`};
  }

  static async logout(token: string) {
    // await Session.deleteOne({accessToken});
    // return {message: "Sesión cerrada exitosamente"};

    try {
      // const authHeader = req.header("Authorization");
      // if (!authHeader || !authHeader.startsWith("Bearer ")) {
      //   return res.status(401).json({ ok: false, error: "Token requerido" });
      // }
      // const token = authHeader.replace("Bearer ", "");

      // Desencriptar el token con jwtDecrypt
      const payload = await TokenService.decryptJweToken(token);

      // Verificar que el payload contenga jti y exp
      if (!payload.jti || !payload.exp) {
        // return res.status(400).json({ ok: false, error: "Token inválido: faltan campos" });
      }

      // Aquí llamas a tu función para revocar el token usando payload.jti y payload.exp
      await revokeToken(payload.jti as string, payload.exp as number);
      return {ok: true, message: "Token revocado exitosamente"}
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
