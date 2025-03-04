import express from 'express';
import {createServer} from 'http';
import cors from 'cors';
import compression from 'compression';
import logger from 'morgan';
import helmet from 'helmet';
import {config} from 'dotenv';
import swaggerUI from 'swagger-ui-express';
import {Connect} from './db/connect';
import AuthMiddleware from './middlewares/AuthMiddleware'
import routers from './routers-setting';
import {AwsSecretsManagerService} from "./lib/services/AwsSecretsManagerService";
import {scheduleKeyRotation} from "./jobs/rotate.job";
import {ENVIRONMENT, PORT_APP} from "./config/environment";


const app = express();
const httpServer = createServer(app);
config();

export class ServerSettings {

  static mountServer() {
    this.corsOrigin();
    this.settings();
    this.testDatabaseConnection();
    this.middlewares();
    this.secretManager();
    this.cronJobs();
    this.docs();
  }

  private static corsOrigin() {
    const corsOptions = {
      origin: ['http://localhost:3001',],
      methods: ['GET', 'HEAD', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 200
    };

     app.use(cors(corsOptions));
  };

  private static settings() {

    app.use(compression());
    // Parse application/json request body
    app.use(express.json());

    // Parse application/x-www-form-urlencoded request body
    app.use(express.urlencoded({extended: false}));

    app.use(logger('dev'));

    // Parse application/x-www-form-urlencoded request body
    app.use(express.urlencoded({limit: '50mb', extended: false, parameterLimit: 500000}));

  };

  private static middlewares() {
    app.use(helmet()); // Helmet para seguridad
   // app.use(authentication); // Middleware de autenticación
    app.use(express.json({limit: '50mb'})); // Parse application/json request body
  }

  private static async secretManager() {
    // Inicializar el secreto en AWS SM si no existe (clave dummy)
    await AwsSecretsManagerService.initSecretIfNotExists();
  }

  private static cronJobs() {
    //Programa la rotación (cron)
    scheduleKeyRotation();
  }

  private static docs() {
    if(ENVIRONMENT === 'develop') {
      const swaggerSpec = require('../docs/configuration').default;
       app.use('/swagger-api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
    }
  };

 private static async testDatabaseConnection(): Promise<void> {
    await Connect.connectDB(); // Conexión a MongoDB
    await Connect.testConnection(); // Probar conexión
    this.routes();
  };


  private static routes() {
    app.set('port', PORT_APP);
    app.use('/', routers);
    console.log(`✔ rutas cargadas...`);
    httpServer.listen(PORT_APP, () => {
      console.log(`Servidor Corriendo en http://localhost:${PORT_APP}`);
      console.log(`Documentación swagger corriendo en http://localhost:${PORT_APP}/swagger-api-docs/`);
    });
  };

}

