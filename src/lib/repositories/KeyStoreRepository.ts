import {AwsSecretsManagerService} from "../services/AwsSecretsManagerService";
import KeyRecord from "../../models/KeyRecord";
import dayjs from "dayjs";
import {KEY_ROTATION_DAYS} from "../../config/environment";

/**
 * Servicio que obtiene la clave privada actual y, si se requiere,
 * la clave antigua para descifrar tokens viejos.
 */
export class KeyStoreRepository {

  /**
   * Retorna la clave actual (isCurrent=true) y su kid.
   * @returns {Promise<{ kid: string; privateKeyPem: string }>}
   */
  static async getCurrentKeyRecord(): Promise<{ kid: string; privateKeyPem: string }> {
    try {
      // Intentar obtener la clave desde AWS Secrets Manager
      const privateKeyPem = await AwsSecretsManagerService.getSecretValue();
      if (!privateKeyPem) {
        throw new Error("No se encontró ninguna clave en AWS Secrets Manager.");
      }

      // Obtener el KeyRecord actual en MongoDB (para obtener el kid correspondiente a esta clave)
      const record = await KeyRecord.findOne({isCurrent: true}).select("kid").lean();
      if (!record) {
        throw new Error("No hay un KeyRecord actual en la base de datos.");
      }

      return {kid: record.kid, privateKeyPem};
    } catch (error: any) {
      console.error("Error obteniendo la clave actual:", error.message);
      throw new Error("No se pudo obtener la clave actual para cifrar/desencriptar.");
    }
  }

  /**
   * Crea un nuevo KeyRecord en la base de datos.
   * @param kid Clave de identificación de la clave.
   * @param version Versión de la clave.
   * @param privateKeyPem Clave privada en formato PEM.
   * @param isCurrent Indica si es la clave actual.
   * @param expireAt Fecha de expiración de la clave.
   * @returns {Promise<void>}
   */
  static async createKeyRecord({kid, version, privateKeyPem, isCurrent, expireAt}:{kid: string; version: number; privateKeyPem: string|any; isCurrent: boolean; expireAt: Date}): Promise<void> {
    await KeyRecord.create({
      kid: kid,
      version: version,
      privateKeyPem: privateKeyPem,
      isCurrent: isCurrent,
      expireAt: expireAt,
    });
  }

  /**
   * Dado un kid, actualiza el KeyRecord correspondiente a isCurrent=false y expira en KEY_ROTATION_DAYS días.
   * @param kid
   */
  static async findOneAndUpdate(kid:string): Promise<void> {
    await KeyRecord.findOneAndUpdate(
      {kid: kid},
      {isCurrent: false, expireAt: dayjs().add(KEY_ROTATION_DAYS, "day").toDate()}
    );
  }

  /**
   * Dado un kid, retorna la privateKeyPem correspondiente
   */
  static async getPrivateKeyByKid(kid: string): Promise<{privateKeyPem:string | null}> {
    const record = await KeyRecord.findOne({kid}).select("privateKeyPem");
    return { privateKeyPem: record ? record.privateKeyPem : null};
  }

}
