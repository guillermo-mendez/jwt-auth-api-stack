import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId; // Referencia al ID del usuario
  accessToken: string; // Token de sesión (JWT)
  expiresAt: Date;  // Fecha de expiración de la sesión
  isValid: boolean; // Indica si el token es válido
  createdAt: Date; // Fecha de creación de la sesión
}

const SessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    accessToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isValid: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    autoIndex: process.env.NODE_ENV !== "test", // Evita índices en pruebas
  }
);

export default mongoose.model<ISession>("Session", SessionSchema);
