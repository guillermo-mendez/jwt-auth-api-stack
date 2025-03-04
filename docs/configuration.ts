import * as path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition= {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JWE authentication API',
      description: 'API for JWE authentication',
      version: '1.0.0'
    }
  },
  apis: [`${path.join(__dirname, '../docs/swagger/**/*.yaml')}`],
}


export default swaggerJSDoc(swaggerDefinition);
