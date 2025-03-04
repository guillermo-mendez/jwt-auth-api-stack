/**
 * Convierte strings como "7d", "1h", "30m", "10s" a milisegundos
 * @param timeStr - String con la duración. Ej: "7d", "1h", "30m", "10s"
 */
function parseDuration(timeStr: string): number {
  // Quitar espacios y pasar a minúsculas
  const str = timeStr.trim().toLowerCase();
  // Extraer la parte numérica y la unidad
  // Este regex asume que la unidad es la última letra
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Formato de duración inválido: "${timeStr}". Usa algo tipo "7d", "30m", etc.`);
  }

  const value = parseInt(match[1], 10); // p. ej. 7
  const unit = match[2];               // p. ej. 'd'

  // Convertir a milisegundos
  switch (unit) {
    case 's': return value * 1000;                 // 1s = 1000 ms
    case 'm': return value * 60_000;               // 1m = 60 * 1000
    case 'h': return value * 3_600_000;            // 1h = 60 * 60 * 1000
    case 'd': return value * 86_400_000;           // 1d = 24 * 60 * 60 * 1000
    default:
      throw new Error(`Unidad desconocida: "${unit}"`);
  }
}

export default parseDuration;
