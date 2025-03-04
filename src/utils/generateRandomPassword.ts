/**
 * Genera una contraseña aleatoria de 8 caracteres.
 * Incluye letras mayúsculas, minúsculas, números y caracteres especiales.
 *
 * @returns {string} Contraseña generada aleatoriamente.
 */
const generateRandomPassword = (): string =>{
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}[]';
  const passwordLength = 8;
  let password = '';

  for (let i = 0; i < passwordLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }

  return password;
}

// import { randomBytes } from 'crypto';
//
// function generateSecurePassword(): string {
//   return randomBytes(6).toString('base64').slice(0, 8); // 8 caracteres seguros
// }

export default generateRandomPassword;