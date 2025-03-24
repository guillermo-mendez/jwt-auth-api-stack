# JWT Auth API Stack

Este proyecto es un sistema de autenticación inspirado en AWS Cognito, implementado en Node.js y TypeScript. El sistema utiliza tokens cifrados (JWE) para el acceso y refresh de usuarios, gestión de usuarios (registro, login), rotación de claves RSA utilizando AWS Secrets Manager y almacenamiento de claves antiguas en MongoDB para permitir el descifrado de tokens emitidos antes de la rotación.

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
├── docs/
│   ├── swagger/             # Documentación de la API (Swagger)
│   ├── build-doc.ts         # Script para generar la documentación
│   └── configuration.ts     # Configuración de Swagger
├── src/
│   ├── config/
│   │   └── environment.ts        # Variables de entorno y configuración
│   ├── constants/
│   │   └── index.ts              # Constantes y mensajes de error
│   ├── db/
│   │   └── connect.ts            # Conexión a MongoDB
│   ├── entities/
│   │   └── BuildTokens.ts        # Entidades para construir tokens JWE
│   ├── jobs/
│   │   └── rotate.job.ts      # Tarea programada (node-cron) para la rotación automática de claves
│   ├── lib/
│   │   ├── controllers/
│   │   │   ├── AuthController.ts    # Lógica de autenticación (login, refresh, revoke)
│   │   │   └── UserController.ts    # Lógica de usuario(registro, perfil) 
│   │   ├── repositories/
│   │   │   ├── AuthRepository.ts             # Lógica de autenticación (login, refresh, revoke)
│   │   │   ├── KeyStoreRepository.ts         # Lógica para recuperar claves RSA
│   │   │   ├── TokenRevocationRepository.ts  # Lógica para revocar tokens (jti)
│   │   │   └── UserRepository.ts             # Lógica de usuario (registro, perfil)
│   │   ├── routers/
│   │   │   ├── admin.ts   # Rutas administrativas (rotación de claves, revocación global)
│   │   │   ├── auth.ts    # Rutas de autenticación (login, refresh, revoke token individual)
│   │   │   ├── index.ts   # Agrupa todas las rutas
│   │   │   └── user.ts    # Rutas de usuario (registro, perfil)
│   │   ├── services/
│   │   │   ├── AwsSecretsManagerConfigService.ts  # Cliente de Secrets Manager como singleton
│   │   │   ├── AwsSecretsManagerService.ts        # Interacción con AWS Secrets Manager
│   │   │   ├── KeyRotationService.ts              # Lógica de rotación de claves RSA
│   │   │   └── TokenService.ts                    # Lógica de creación y validación de tokens JWE
│   │   ├── KeyStoreService.ts                 # Recupera la clave actual y por kid
│   │   ├── AuthService.ts                     # Genera y descifra tokens JWE (incluye jti y tokenVersion)
│   │   ├── UserService.ts                     # Gestión de usuarios (registro, login, revocación global con tokenVersion)
│   │   └── TokenRevocationService.ts          # Funciones para revocar tokens individualmente (jti) y verificar revocación
│   ├── middlewares/
│   │   └── AuthMiddleware.ts                  # Middleware para proteger rutas verificando tokens y tokenVersion
│   ├── models/
│   │   ├── KeyRecord.ts     # Modelo para almacenar claves antiguas (rotación)
│   │   ├── RevokedToken.ts  # Modelo para tokens revocados (jti)
│   │   ├── Session.ts       # Modelo para sesiones de usuario (refresh tokens)
│   │   └── User.ts          # Modelo de usuario (incluye tokenVersion)
│   ├── seeds/
│   │   └── seedAdmin.ts     # Script para crear un usuario administrador
│   ├── utils/
│   │   ├── generateRandomPassword.ts     # Genera una contraseña aleatoria
│   │   ├── parseDuration.ts              # Convierte una duración en segundos a un string de tiempo
│   │   ├── removeExtension.ts            # Elimina la extensión de un archivo
│   │   └── removeNumbersFromAString.ts   # Elimina los números de una cadena
│   └── index.ts                          # Punto de entrada principal de la aplicación
│   └── routers-setting.ts                # Configuración de rutas
│   └── server-settings.ts                # Configuración del servidor
├── .env.example               # Ejemplo de archivo de variables de entorno
├── docker-compose.yml         # Configuración de Docker
├── nodemon.json               # Configuración de nodemon para desarrollo
├── package.json               # Dependencias y scripts
└── tsconfig.json              # Configuración de TypeScript

```
## Instalación y Configuración

## Configuración y Variables de Entorno

En el archivo `.env` se definen variables de entorno como en el archivo `.env.example`:
```
MONGO_URI=mongodb://localhost:27017/mydb
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=you_access_key_id_here
AWS_SECRET_ACCESS_KEY=you_secret_access_key_here
SECRETS_NAME=you_secrets_name_here 
KEY_ROTATION_DAYS=30
REFRESH_TOKEN_EXPIRATION=7d
ACCESS_TOKEN_EXPIRATION=15m 
PORT=3000 
JWT_SECRET=your_jwt_secret_here
```

> **Nota:** No subas el archivo `.env` al repositorio.

## Instalación y Ejecución

### Requisitos Previos
- Node.js (versión 18 o superior)
- Docker
- Acceso a AWS Secrets Manager con las credenciales configuradas mediante variables de entorno

### Instalación
1. Clona el repositorio.
2. Instala las dependencias:
3. Crea un archivo `.env` con las variables de entorno.
4. Ejecuta el archivo docker-compose.yml para levantar la base de datos MongoDB.

```bash
   npm install
```

```bash
   docker-compose up
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
2. Compila la documentación de la API (Swagger):
```bash
  npm run build-doc
```
3. Inicia la aplicación:
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







   
