import RevokedToken, { IRevokedToken } from "../../models/RevokedToken";

/**
 * Revoca un token almacenando su `jti` y la fecha de expiración en la base de datos.
 * @param jti - El JWT ID del token a revocar.
 * @param exp - La fecha de expiración del token, en segundos desde Epoch.
 */
export async function revokeToken(jti: string, exp: number): Promise<void> {
  // Convertir exp a Date (exp está en segundos, Date espera ms)
  const expiresAt = new Date(exp * 1000);

  // Crear el registro de token revocado
  await RevokedToken.create({ jti, expiresAt });
}

/**
 * Verifica si el token con el `jti` dado se encuentra en la lista de revocados.
 * @param jti - El JWT ID a verificar.
 * @returns true si el token está revocado, false de lo contrario.
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const revoked = await RevokedToken.findOne({ jti });
  return revoked !== null;
}
