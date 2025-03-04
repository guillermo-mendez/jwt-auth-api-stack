import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import {AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY} from "../../config/environment";

export class AwsSecretsManagerConfigService {
  /** Cliente de Secrets Manager como singleton */
  private static client: SecretsManagerClient | null = null;

  /**
   * Devuelve la instancia única de SecretsManagerClient
   * @returns SecretsManagerClient
   */
  public static getClient(): SecretsManagerClient {
    if (!this.client) {
      this.client = new SecretsManagerClient({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      });
      console.log("AWS Secrets Manager Client inicializado.");
    }
    return this.client;
  }
}
