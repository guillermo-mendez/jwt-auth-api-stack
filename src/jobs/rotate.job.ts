import cron from "node-cron";
import { KeyRotationService } from "../lib/services/KeyRotationService";

/**
 * Programa una tarea para rotar las claves RSA con la frecuencia que desees.
 * Ejemplo: cada domingo a medianoche => "0 0 * * 0"
 */
export function scheduleKeyRotation() {
  cron.schedule("0 0 * * 0", async () => {
    console.log("[KeyRotationJob] Iniciando rotación de claves...");
    try {
      await KeyRotationService.rotateKeys();
      console.log("[KeyRotationJob] Rotación completada.");
    } catch (err) {
      console.error("[KeyRotationJob] Error:", err);
    }
  });
}
