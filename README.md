# JWT Auth API Stack

Este proyecto es un sistema de autenticación inspirado en AWS Cognito, implementado en Node.js y TypeScript. El sistema utiliza tokens cifrados (JWE) para el acceso y refresh de usuarios, gestión de usuarios (registro, login), rotación de claves RSA utilizando AWS Secrets Manager y almacenamiento de claves antiguas en MongoDB para permitir la descifrado de tokens emitidos antes de la rotación.

## Características Principales

- **Generación de Access Token y Refresh Token:**
  - **Access Token:** Token cifrado (JWE) con expiración corta (15 minutos o 1 hora) que incluye datos del usuario (userId, email, etc.) y el claim `tokenVersion`.
  - **Refresh Token:** Token cifrado (JWE) con expiración larga (7 días) para renovar el Access Token sin necesidad de reautenticación.

- **Cifrado y Descifrado de Tokens (JWE):**
  - Utiliza la librería `jose` con el esquema `"alg": "RSA-OAEP"` y `"enc": "A256GCM"`.
  - Se incluye un `kid` en el header para identificar la clave utilizada.

- **Rotación de Claves RSA:**
  - Genera un nuevo par RSA y rota la clave privada en AWS Secrets Manager.
  - Guarda la clave privada anterior en MongoDB (modelo KeyRecord) con un `expireAt` para permitir la descifrado de tokens antiguos hasta su expiración.
  - Se puede programar la rotación mediante un job (node-cron) y/o mediante un endpoint administrativo.

- **Revocación de Tokens:**
  - **Revocación individual:** Se puede revocar un token específico utilizando su identificador único `jti` y almacenándolo en una lista negra.
  - **Revocación global:** Se implementa un mecanismo de token versioning. Cada usuario tiene un campo `tokenVersion` en su registro; al incrementarlo se invalidan todos los tokens emitidos con la versión anterior.

- **Gestión de Usuarios:**
  - Registro y login de usuarios con contraseña hasheada (usando bcrypt).
  - Endpoints para obtener el perfil del usuario.

## Estructura del Proyecto
```
jwt-auth-api-stack/
├── src/
│   ├── config/
│   │   └── environment.ts        # Variables de entorno y configuración
│   ├── db/
│   │   └── connect.ts            # Conexión a MongoDB
│   ├── models/
│   │   ├── User.ts               # Modelo de usuario (incluye tokenVersion)
│   │   ├── KeyRecord.ts          # Modelo para almacenar claves antiguas (rotación)
│   │   └── RevokedToken.ts       # Modelo para tokens revocados (lista negra de jti)
│   ├── services/
│   │   ├── AwsSecretsManagerService.ts   # Interacción con AWS Secrets Manager
│   │   ├── KeyRotationService.ts           # Lógica de rotación de claves RSA
│   │   ├── KeyStoreService.ts              # Recupera la clave actual y por kid
│   │   ├── AuthService.ts                  # Genera y descifra tokens JWE (incluye jti y tokenVersion)
│   │   ├── UserService.ts                  # Gestión de usuarios (registro, login, revocación global con tokenVersion)
│   │   └── TokenRevocationService.ts        # Funciones para revocar tokens individualmente (jti) y verificar revocación
│   ├── middlewares/
│   │   └── authJweMiddleware.ts             # Middleware para proteger rutas verificando tokens y tokenVersion
│   ├── routes/
│   │   ├── auth.route.ts      # Endpoints de autenticación (login, refresh, revoke token individual)
│   │   ├── user.route.ts      # Endpoints de usuario (registro, perfil)
│   │   └── admin.route.ts     # Endpoints administrativos (rotación de claves, revocación global)
│   ├── jobs/
│   │   └── rotate.job.ts      # Tarea programada (node-cron) para la rotación automática de claves
│   └── index.ts               # Punto de entrada principal de la aplicación
├── nodemon.json               # Configuración de nodemon para desarrollo
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración de TypeScript
└── .env 
```
## Instalación y Configuración

## Configuración y Variables de Entorno

En el archivo `.env` se definen variables como:
```
AWS_REGION=us-east-1
SECRETS_NAME=myProject/jweKeyPair
MONGODB_URI=mongodb://localhost:27017/mydb 
KEY_ROTATION_DAYS=30 
PORT=3000 
REFRESH_TOKEN_EXPIRATION=7d
ACCESS_TOKEN_EXPIRATION=15m 
JWT_SECRET=your_jwt_secret_here
```

> **Nota:** No subas el archivo `.env` al repositorio.

## Instalación y Ejecución

### Requisitos Previos
- Node.js (versión 18 o superior)
- MongoDB
- Acceso a AWS Secrets Manager con las credenciales configuradas mediante variables de entorno

### Instalación
1. Clona el repositorio.
2. Instala las dependencias:
```bash
   npm install
```

# Desarrollo
Para correr la aplicación en modo desarrollo (con recarga automática y uso de ts-node en modo ESM):

1. Configura el archivo nodemon.json (ya incluido):
```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["node_modules"],
  "exec": "ts-node --esm -r dotenv/config src/index.ts"
}
```
2. Inicia la aplicación:
```bash
  npm run dev
  ````
 
# Producción
Para correr la aplicación en modo producción (compilando TypeScript a JavaScript y ejecutando el servidor):
1. Compila el código TypeScript:
```bash
  npm run build
```
Esto generará el código compilado en la carpeta dist/.

2. Inicia la aplicación:
```bash
  npm start
```







   
