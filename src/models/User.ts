import mongoose, { Document, Schema } from "mongoose";
import bcrypt from 'bcryptjs';
import {BCRYPT_SALT_ROUNDS} from "../constants";

export interface IUser extends Document {
  _id: string;
  identification: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null; // Campo para soft delete
  hashPassword(): Promise<void>;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    identification: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    tokenVersion: { type: Number, default: 0 }, // Comienza en 0
    deletedAt: { type: Date, default: null } // Inicialmente NULL (no eliminado)
  },
  {
    timestamps: true, // Añade automáticamente createdAt y updatedAt
    autoIndex: process.env.NODE_ENV !== "test" // Evita índices en pruebas
  }
);

// **Middleware**: Hash de contraseña antes de guardar
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  next();
});

// **Método**: Comparar contraseña
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
