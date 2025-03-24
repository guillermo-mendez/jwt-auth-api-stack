import crypto from "crypto";
import { AwsSecretsManagerService } from "./AwsSecretsManagerService";
import dayjs from "dayjs";
import { KEY_ROTATION_DAYS } from "../../config/environment";
import {KeyStoreRepository} from "../repositories/KeyStoreRepository";

/**
 * Servicio que maneja la rotación de claves RSA:
 * - Genera un nuevo par de claves.
 * - Sube la nueva clave privada a AWS Secrets Manager.
 * - Guarda la clave privada anterior en Mongo (KeyRecord) con expiración.
 */
export class KeyRotationService {
  /**
   * Realiza la rotación de la clave:
   * 1. Obtiene la clave previa (si existe) de Secrets Manager.
   * 2. Genera un nuevo par RSA y sube la privateKey a Secrets Manager.
   * 3. Almacena la clave previa en KeyRecord, con expireAt (opcional).
   */
  static async rotateKeys(): Promise<{ message: string }> {
    let oldKeyPem: string | null = null;
    let oldKeyKid: string | null = null;

    try {
      // El secreto puede ser algo como "kid|privateKeyPem" en un JSON.
      // O guardas el kid en tu DB y la privateKey en Secrets Manager.
      // Aquí un approach simplificado donde Secrets Manager solo guarda la privateKey.
      // Intentar obtener la clave previa
      oldKeyPem = await AwsSecretsManagerService.getSecretValue();

      // Podríamos buscar la KeyRecord actual para ver su kid
      const existingCurrent = await KeyStoreRepository.getCurrentKeyRecord();
      if (existingCurrent) {
        oldKeyKid = existingCurrent.kid;
      }

    } catch (error: any) {
      if (error.name !== "ResourceNotFoundException") {
        console.error("Error obteniendo clave previa:", error);
        throw error;
      }
      console.log("No hay clave previa (primera vez)");
    }

    // 1) Generar un nuevo par de claves
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    const newPrivateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

    // 2) Generar un nuevo kid (puede ser un timestamp o uuid)
    const newKid = `kid-${Date.now()}`;

    // 3) Subir la clave nueva a Secrets Manager
    await AwsSecretsManagerService.rotateSecret(newPrivateKeyPem);


    // 4) Manejo especial para la **primera rotación**
    if (!oldKeyPem) {
      console.log("Primera rotación detectada: Guardando la clave actual en MongoDB también");
      oldKeyPem = newPrivateKeyPem;  // La primera clave se guarda también en Mongo
    }

    // 5) Marcar la clave anterior como no actual
    if (oldKeyKid) {
      // Hallar el record actual y actualizarlo
      await KeyStoreRepository.findOneAndUpdate(oldKeyKid);
      console.log("Clave anterior marcada con expireAt y isCurrent=false");
    }

    // 6) Guardar la nueva clave en MongoDB (pero con la clave previa en privateKeyPem)
      await KeyStoreRepository.createKeyRecord({
        kid: newKid,
        version: Date.now(),
        privateKeyPem: oldKeyPem, // La clave previa se guarda aquí
        isCurrent: true,
        // Configurar para eliminar tras KEY_ROTATION_DAYS
        expireAt: dayjs().add(KEY_ROTATION_DAYS, "day").toDate()
      });
    console.log(`Nueva clave RSA generada con kid=${newKid} y almacenada`);
    return {message: "Key rotation executed successfully"};
  }
}
