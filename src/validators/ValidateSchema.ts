import * as yup from "yup";

  /**
   * Valida los datos usando el esquema proporcionado.
   * @param schema - Esquema de Yup para validar.
   * @param data - Datos a validar.
   * @returns - Valida los datos o lanza un error.
   */
  export const validateSchema = (schema: yup.ObjectSchema<any>, data: any) =>{
    try {
      schema.validateSync(data, { abortEarly: false }); // Valida todos los errores, no solo el primero
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        throw new Error(
          error.errors.join(', ') // Combina todos los errores en un solo mensaje
        );
      }
      throw error; // Si no es un error de Yup, lo re-lanza
    }
  } 
  
  /**
   * Valida los datos usando el esquema proporcionado.
   * @param schema - Esquema de Yup para validar.
   * @param data - Datos a validar.
   * @returns - Valida los datos o lanza un error.
   */
  export const validateSchemaArray = (schema: yup.ArraySchema<any, any>, data: any) =>{
    try {
      schema.validateSync(data, { abortEarly: false }); // Valida todos los errores, no solo el primero
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        throw new Error(
          error.errors.join(', ') // Combina todos los errores en un solo mensaje
        );
      }
      throw error; // Si no es un error de Yup, lo re-lanza
    }
  }
