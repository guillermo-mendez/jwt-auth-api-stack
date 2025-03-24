import crypto from "crypto";
import {
  CreateSecretCommand,
  PutSecretValueCommand,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {KEY_ROTATION_DAYS, SECRETS_NAME} from "../../config/environment";
import {AwsSecretsManagerConfigService} from "./AwsSecretsManagerConfigService";
import {KeyStoreRepository} from "../repositories/KeyStoreRepository";
import dayjs from "dayjs";

/**
 * Servicio para interactuar con AWS Secrets Manager.
 * - Permite crear el secreto si no existe.
 * - Obtener y rotar su valor.
 */
export class AwsSecretsManagerService {

  /**
   * Crea el secreto en AWS Secrets Manager si no existe previamente.
   * @throws Error si hay un problema distinto de "ResourceNotFoundException".
   */
  static async initSecretIfNotExists() {
    const client = AwsSecretsManagerConfigService.getClient();
    try {
      // Verificar si existe
      const command = new GetSecretValueCommand({ SecretId: SECRETS_NAME });
      const response = await client.send(command);

      try {
        // Asegurar que el secreto está en MongoDB
        const existingKey = await KeyStoreRepository.getCurrentKeyRecord();
        if (!existingKey) {
          console.log("⚠️ No hay KeyRecord en MongoDB, agregando clave...");

          // Crear un nuevo KeyRecord en MongoDB
          await KeyStoreRepository.createKeyRecord({
            kid: `kid-${Date.now()}`,
            version: Date.now(),
            privateKeyPem: response.SecretString,
            isCurrent: true,
            expireAt: dayjs().add(KEY_ROTATION_DAYS, "day").toDate(),
          });
          console.log("✅ Clave agregada a MongoDB correctamente.");
        }

      } catch (err) {
        // Crear un nuevo KeyRecord en MongoDB
        await KeyStoreRepository.createKeyRecord({
          kid: `kid-${Date.now()}`,
          version: Date.now(),
          privateKeyPem: response.SecretString,
          isCurrent: true,
          expireAt: dayjs().add(KEY_ROTATION_DAYS, "day").toDate(),
        });
        console.log("✅ Clave agregada a MongoDB correctamente.");
      }

      // Si no lanza error, significa que ya existe => no hacemos nada
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        console.log("Secreto no encontrado, creando uno nuevo...");

        // Generar una clave RSA nueva
        const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
        const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

        // Crear el secreto en AWS Secrets Manager
        await client.send(new CreateSecretCommand({
          Name: SECRETS_NAME,
          SecretString: privateKeyPem
        }));
        console.log(`✅ Secreto ${SECRETS_NAME} creado en AWS Secrets Manager`);

        // Crear un nuevo KeyRecord en MongoDB
        await KeyStoreRepository.createKeyRecord({
          kid: `kid-${Date.now()}`,
          version: Date.now(),
          privateKeyPem: privateKeyPem,
          isCurrent: true,
          expireAt: dayjs().add(KEY_ROTATION_DAYS, "day").toDate(),
        });

        console.log(`Secret ${SECRETS_NAME} creado en AWS Secrets Manager`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Retorna el valor actual del secreto en AWS Secrets Manager.
   * @returns El string del secreto (SecretString).
   * @throws Error si el secreto no tiene SecretString.
   */
  static async getSecretValue(): Promise<string> {
    const client =AwsSecretsManagerConfigService.getClient();
    const resp = await client.send(
      new GetSecretValueCommand({ SecretId: SECRETS_NAME })
    );
    if (!resp.SecretString) {
      throw new Error(`El secreto '${SECRETS_NAME}' no contiene SecretString`);
    }
    return resp.SecretString;
  }

  /**
   * Actualiza (rota) el secreto con un nuevo valor en AWS Secrets Manager.
   * @param newValue Nuevo valor del secreto (por ejemplo, una nueva clave privada).
   */
  static async rotateSecret(newValue: string) {
    const client =AwsSecretsManagerConfigService.getClient();
    const putCmd = new PutSecretValueCommand({
      SecretId: SECRETS_NAME,
      SecretString: newValue,
    });

    await client.send(putCmd);

    console.log(`Secret '${SECRETS_NAME}' rotado en AWS Secrets Manager`);
  }
}
