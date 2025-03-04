export const STATUSES = {
  ACTIVE:{ id: 1, code: 'ACTIVE' }, // El recurso está activo
  INACTIVE: { id: 2, code: 'INACTIVE' }, // El recurso está inactivo
  DELETED: { id: 5, code: 'DELETED' }, // El recurso fue eliminado
};

export const ENDPOINTS_WITH_AUTHORIZATION = [
  '/api/auth/login',
  '/api/auth/refreshToken',
  '/api/auth/resetPassword',
  '/api/user/createPassword',
  '/api/user/forgotPassword',
];

export const BASE_ENDPOINT = '/api';

export const ROLES = {
  ADMINISTRADOR: 'Administrador',
};

export const BCRYPT_SALT_ROUNDS = 10;
