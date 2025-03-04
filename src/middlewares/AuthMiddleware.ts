import {Request, Response, NextFunction} from 'express';
import {TokenService} from '../lib/services/TokenService'
import {ENDPOINTS_WITH_AUTHORIZATION} from '../constants';
import {ENVIRONMENT} from "../config/environment";
import {UserRepository} from "../lib/repositories/UserRepository";

/**
 * Middleware para validar el token de autenticación
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
const AuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const isAllowed = ENDPOINTS_WITH_AUTHORIZATION.some(endpoint => req.path.includes(endpoint));

  if (isAllowed) {
    return next();
  }

  if (ENVIRONMENT === 'develop') {
    if (req.path.startsWith('/swagger-api-docs')) {
      return next();
    }
  }

  if (req.path.includes('/health') && req.method.toUpperCase() === 'GET') {
    return next();
  }

  if (!req.headers['authorization']) {
    return res.status(403).json({statusText: 'Api not authorized, invalid header'});
  }

  const accessToken = req.headers['authorization'].replace('Bearer ', '');
  if (!accessToken) {
    return res.status(403).json({statusText: 'Invalid authentication token'});
  }

  try {
    const payload = await TokenService.decryptJweToken(accessToken);
    // Buscar al usuario en la DB para obtener el tokenVersion actual
    const user = await UserRepository.getUserByUserId(payload.userId);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ok: false, error: "Token has been revoked"});
    }

    (req as any).userId = payload.userId;
    next();

  } catch (error) {
    return res.status(403).json({statusText: 'Internal error authentication failed'});
  }

};

export default AuthMiddleware;

