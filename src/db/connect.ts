import mongoose from "mongoose";
import { config } from "dotenv";
import {MONGO_URI} from "../config/environment";

config();

export class Connect {
  private static instance: Connect;
  private static mongoUri: string = MONGO_URI

  private constructor() {}

  public static getInstance(): Connect {
    if (!Connect.instance) {
      Connect.instance = new Connect();
    }
    return Connect.instance;
  }

  public static async connectDB(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        console.log("MongoDB is already connected.");
        return;
      }

      await mongoose.connect(Connect.mongoUri, {
        serverSelectionTimeoutMS: 5000, // Evita que la conexión se bloquee por mucho tiempo
      });

      console.log("✔ MongoDB connected successfully");
    } catch (error) {
      console.error("❌ MongoDB connection error:", error);
      process.exit(1);
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 0) {
        console.log("MongoDB is already disconnected.");
        return;
      }

      await mongoose.disconnect();
      console.log("🔌 MongoDB disconnected successfully");
    } catch (error) {
      console.error("❌ MongoDB disconnection error:", error);
    }
  }

  public static async dropDatabase(): Promise<void> {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.error("❌ Cannot drop database: No active MongoDB connection.");
        return;
      }

      await mongoose.connection.dropDatabase();
      console.log("🔥 MongoDB database dropped successfully");
    } catch (error) {
      console.error("❌ MongoDB database drop error:", error);
    }
  }

  public static async testConnection(): Promise<void> {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.error("❌ MongoDB is not connected yet.");
        return;
      }

      const db = mongoose.connection.db;
      if (!db) {
        throw new Error("❌ Database instance is undefined.");
      }

      await db.command({ ping: 1 });
      console.log("✔ MongoDB connection is active");
    } catch (error) {
      console.error("❌ MongoDB test connection failed:", error);
    }
  }

}
