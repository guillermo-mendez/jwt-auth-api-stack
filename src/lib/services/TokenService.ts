import {jwtDecrypt, EncryptJWT, decodeProtectedHeader} from 'jose'
import crypto from "crypto";
import {v4 as uuidv4} from 'uuid';
import {KeyStoreRepository} from "../repositories/KeyStoreRepository";
import {
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION
} from "../../config/environment";
import {isTokenRevoked} from "../repositories/TokenRevocationRepository";
import parseDuration from "../../utils/parseDuration";
import {TOKEN_TYPES} from "../../constants";

/**
 * Este servicio se encarga de encriptar y desencriptar un token (por ejemplo, un Refresh Token).
 * Usa cifrado "dir" con "A256GCM". La clave debe ser un Uint8Array / Buffer de 32 bytes (256 bits).
 */
export class TokenService {

  /**
   * Genera un Access Token cifrado (JWE) con RSA-OAEP y A256GCM.
   * Se incluye un `jti` único para poder revocar este token de forma individual.
   * @param payload Objeto con datos del usuario (p.ej., { userId, email }).
   * @returns { accessToken: string, expiresIn: number }
   */
  static async generateJweAccessToken(payload: Record<string, any>): Promise<{
    accessToken: string,
    expiresIn: number
  }> {

    // 1) obtener la clave actual (privateKey + kid)
    const {kid, privateKeyPem} = await KeyStoreRepository.getCurrentKeyRecord();

    // 2) Derivar la publicKey
    const privateKeyObj = crypto.createPrivateKey({key: privateKeyPem,format: "pem",type: "pkcs8"});// o "pkcs8" según corresponda
    const publicKeyObj = crypto.createPublicKey(privateKeyObj);

    // 3) Genera un jti único
    const jti = uuidv4();

    const tokenType = TOKEN_TYPES.ACCESS_TOKEN; // 🔹 Campo para identificar el tipo de token

    // 4) Agregar un campo para identificar el tipo de token
    payload.tokenType = tokenType;

    // 5) Cifrar con kid en el header con jose
    const expAccessToken = Math.floor((Date.now() + parseDuration(ACCESS_TOKEN_EXPIRATION)) / 1000); // Segundos
    const jwe = await new EncryptJWT({...payload, jti})
      .setProtectedHeader({alg: "RSA-OAEP", enc: "A256GCM", kid, tokenType})
      .setIssuedAt() // agrega el claim 'iat' con la fecha/hora actual en segundos
      .setIssuer('https://citruxtec.com') // 'iss' quien emite el token
      .setAudience('https://citruxtec.com/myservice') // 'aud' para quién va destinado
      .setSubject(payload.userId) // 'sub', el sujeto del token a menudo el userId
      .setNotBefore("10s") // (Opcional) claim 'nbf', indica cuándo el token se vuelve válido (Ejemplo: no antes de 10 segundos desde ahora)
      .setExpirationTime(ACCESS_TOKEN_EXPIRATION) // exp para que caduque en 15 minutos (formato legible como "2h", "10m", etc.).
      .setJti(jti) // (Opcional) claim 'jti', un identificador único para el token
      .encrypt(publicKeyObj);

    return {
      accessToken: jwe,
      expiresIn: expAccessToken
    };
  }

  /**
   * Genera un token JWE con "RSA-OAEP" + "A256GCM".
   * @param payload Objeto que quieres cifrar en el JWT
   * @returns String con el JWE
   */
  static async generateJweRefreshToken(payload: Record<string, any>): Promise<{
    refreshToken: string,
    expiresIn: number
  }> {

    // 1) obtener la clave actual (privateKey + kid)
    const {kid, privateKeyPem} = await KeyStoreRepository.getCurrentKeyRecord();

    // 2) Derivar la publicKey
    const privateKeyObj = crypto.createPrivateKey({
      key: privateKeyPem,
      format: "pem",
      type: "pkcs8", // o "pkcs8" según corresponda
    });
    const publicKeyObj = crypto.createPublicKey(privateKeyObj);

    // 3) Genera un jti único
    const jti = uuidv4();

    const tokenType = TOKEN_TYPES.REFRESH_TOKEN; // 🔹 Campo para identificar el tipo de token

    // 4) Agregar un campo para identificar el tipo de token
    payload.tokenType = tokenType

    // 5) Cifrar con kid en el header con jose
    const expRefreshToken: number = Math.floor((Date.now() + parseDuration(REFRESH_TOKEN_EXPIRATION)) / 1000); // Segundos
    // const iat = Math.floor(Date.now() / 1000);
    const jwe = await new EncryptJWT(payload)
      .setProtectedHeader({alg: "RSA-OAEP", enc: "A256GCM", kid, tokenType})
      .setIssuedAt() // agrega el claim 'iat' con la fecha/hora actual en segundos
      .setSubject(payload.userId) // 'sub', el sujeto del token a menudo el userId
      .setNotBefore("10s") // (Opcional) claim 'nbf', indica cuándo el token se vuelve válido (Ejemplo: no antes de 10 segundos desde ahora)
      .setExpirationTime(ACCESS_TOKEN_EXPIRATION) // exp para que caduque en 15 minutos (formato legible como "2h", "10m", etc.).
      .setJti(jti) // (Opcional) claim 'jti', un identificador único para el token
      .encrypt(publicKeyObj);

    return {
      refreshToken: jwe,
      expiresIn: expRefreshToken
    };
  }

  static verifyTokenType(payload: any): string {

      if (payload.tokenType === TOKEN_TYPES.ACCESS_TOKEN) {
        console.log("🔹 Es un Access Token");
        return TOKEN_TYPES.ACCESS_TOKEN;
      } else if (payload.tokenType === TOKEN_TYPES.REFRESH_TOKEN) {
        console.log("🔹 Es un Refresh Token");
        return TOKEN_TYPES.REFRESH_TOKEN;
      } else {
        console.warn("⚠️ El token no tiene un tipo definido.");
        throw new Error("❌ Error al verificar el tipo de token: Token invalido, no tiene un tipo definido");
      }
  }

  /**
   * Descifra un token JWE. Si no puede con la clave actual, busca la antigua.
   * @param jweToken Token encriptado con RSA-OAEP + A256GCM
   * @returns El payload descifrado
   * @throws Error si el token está revocado o inválido.
   */
  static async decryptJweToken(jweToken: string): Promise<Record<string, any>> {
    try {
      // 1) Extraer el header del token JWE para obtener el `kid`
      const header = decodeProtectedHeader(jweToken);
      console.log("Header del token:", header);

      this.verifyTokenType(header);

      if (!header.kid || typeof header.kid !== "string") {
        throw new Error("Token no contiene un 'kid' válido.");
      }

      let privateKeyPem: string | null = null;
      let source: "AWS" | "MongoDB" | "None" = "None"; // Para depuración

        // 2) Intentar obtener la clave desde AWS Secrets Manager
        const awsKeyRecord = await KeyStoreRepository.getCurrentKeyRecord();

        // 3) Verificar si el kid de AWS es el mismo que el del token
        if (awsKeyRecord.kid === header.kid) {
          privateKeyPem = awsKeyRecord.privateKeyPem;
          source = "AWS";
        } else {
          // 4) Si la clave de AWS no coincide con el `kid` del token, buscar la clave en MongoDB
          const keyRecord = await KeyStoreRepository.getPrivateKeyByKid(header.kid);
          if (keyRecord) {
            privateKeyPem = keyRecord.privateKeyPem;
            source = "MongoDB";
          }
        }

      if (!privateKeyPem) {
        throw new Error(`No se encontró ninguna clave privada para kid=${header.kid}`);
      }

      // Convertir la clave a formato PKCS8 si es necesario
      if (!privateKeyPem.includes("BEGIN PRIVATE KEY")) {
        privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyPem}\n-----END PRIVATE KEY-----`;
      }

      console.log(`Usando clave de ${source} para desencriptar el token con kid=${header.kid}`);

      // 4) Crear la clave privada para desencriptar
      const privateKeyObj = crypto.createPrivateKey({ key: privateKeyPem as string, format: "pem" });

      // 5) Desencriptar el token JWE
      const { payload } = await jwtDecrypt(jweToken, privateKeyObj);
     // console.log("Token desencriptado:", payload);

      // 6) Verificar si el token es un Access Token o Refresh Token
      this.verifyTokenType(payload);


      // 7) Verificar si el token ha sido revocado
      const isRevoked = await isTokenRevoked(payload.jti as string);
      if (payload.jti && isRevoked) {
        return {message: 'El token ha sido revocado, inicie sesión nuevamente'};
      }

      return payload as Record<string, any>;

    } catch (error: any) {
      // ✅ Manejo de error específico para token expirado
      console.log(error.code, error.payload);
      if (error.code === "ERR_JWT_EXPIRED") {
       // console.error("⏳ Token expirado:", error);
        const isRevoked = await isTokenRevoked(error.payload.jti as string);
        if (error.payload.jti && isRevoked) {
          return {message: 'El token ha sido revocado, inicie sesión nuevamente'};
        }
       // throw new Error("El token ha expirado. Por favor, inicia sesión nuevamente.");
      }

      // ✅ Manejo de error genérico
      console.error("Error al desencriptar JWE:", error);
      throw new Error("Error en la autenticación. Inténtalo nuevamente.");
    }
  }

}
