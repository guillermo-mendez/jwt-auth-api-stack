import * as yup from 'yup';
import {validateSchema} from "./ValidateSchema";

class AuthValidator {
  /**
   * Valida los datos del login.
   * @param data - Datos a validar.
   */
  public loginValidation(data: any) {
    const schema = yup.object().shape({
      username: yup
        .string()
        .required('El campo usuario es requerido')
        .min(3, 'El usuario debe tener al menos 3 caracteres'),
      password: yup
        .string()
        .required('Debe ingresar una contraseña')
        .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    });
    validateSchema(schema, data);
  }

  /**
   * Valida los datos del refresh token.
   * @param data - Datos a validar.
   */
  public refreshTokenValidation(data: any) {
    const schema = yup.object().shape({
      refreshToken: yup.string().required('Es necesario un refreshToken'),
    });
    validateSchema(schema, data);
  }
}

export default new AuthValidator();
