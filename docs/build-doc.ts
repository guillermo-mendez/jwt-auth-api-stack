import * as fs from 'fs';
import * as path from 'path';
import swaggerSpec from './configuration';

  try {
    const data = JSON.stringify(swaggerSpec);
    fs.writeFileSync(`${path.join(__dirname, '../docs/swagger.json')}`, data);
    console.log(`✔ Documentación creada con éxito.`);
  } catch (err) {
    console.log(`Error al crear la documentación.`);
  }
