import mongoose, { Schema, Document } from "mongoose";

/**
 * Interfaz que representa un token revocado.
 */
export interface IRevokedToken extends Document {
  jti: string;       // JWT ID único del token
  expiresAt: Date;   // Fecha en la que el token revocado expira
}

const RevokedTokenSchema: Schema = new Schema<IRevokedToken>(
  {
    jti: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Índice TTL: MongoDB eliminará automáticamente el documento cuando expire.
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRevokedToken>("RevokedToken", RevokedTokenSchema);
