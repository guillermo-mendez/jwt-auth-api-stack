import dotenv from "dotenv";
dotenv.config();

export const ENVIRONMENT = process.env.ENVIRONMENT;
export const PORT_APP = process.env.PORT || 3000;
export const MONGO_URI = process.env.MONGO_URI || "mongodb://admin:admin123@localhost:27017/jwt_auth?authSource=admin";
export const AWS_REGION = process.env.AWS_REGION || "us-east-1";
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
export const SECRETS_NAME = process.env.SECRETS_NAME || "jwtAuthApiStack/refreshEncKey";
export const KEY_ROTATION_DAYS = parseInt(process.env.KEY_ROTATION_DAYS || "7", 10);
export const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || "15m"; // Token de acceso dura 15 min
export const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || "7d"; // RefreshToken dura 7 días