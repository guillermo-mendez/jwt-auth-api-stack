import mongoose, { Schema, Document } from "mongoose";

/**
 * Interfaz que describe el registro de una clave privada antigua,
 * guardada para descifrar tokens emitidos antes de la rotación.
 */
export interface IKeyRecord extends Document {
  kid: string;           // Identificador de la clave (Key ID)
  version: number;        // Versión o identificador de la clave
  privateKeyPem: string;  // Clave privada en formato PEM
  isCurrent?: boolean;    // Si es la clave actual (opcional)
  createdAt: Date;        // Fecha de creación (timestamps = true)
  expireAt?: Date;        // Opcional: fecha en que se eliminará de la BD
}

/**
 * Esquema de KeyRecord en MongoDB.
 * - kid: identificador de la clave (Key ID).
 * - version: número que identifica esta clave.
 * - privateKeyPem: la clave privada antigua en PEM.
 * - expireAt: si lo deseas, configurado para borrarse automáticamente.
 */
const KeyRecordSchema: Schema = new Schema<IKeyRecord>(
  {
    kid: { type: String, required: true },
    version: { type: Number, required: true },
    privateKeyPem: { type: String, required: true },
    isCurrent: { type: Boolean, default: true },
    expireAt: { type: Date },
  },
  { timestamps: true }
);

/**
 * Si deseas borrarlo tras expireAt, configuras un índice TTL.
 */
KeyRecordSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IKeyRecord>("KeyRecord", KeyRecordSchema);
