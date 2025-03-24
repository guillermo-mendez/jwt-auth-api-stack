import {Request, Response} from 'express';
import moment from "moment";
import {UserRepository} from "../repositories/UserRepository";


export class UserController {

  static async getUsers(req: Request, res: Response):Promise<any> {
    try {
      const users = await UserRepository.getUsers();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: "Usuario encontrado",
        data: users
      });
    } catch (error: any) {
      return res.status(400).json({ statusCode: 400, success: false, statusText: error.message, data:null });
    }
  }

  static async getUserByUserId(req: Request, res: Response):Promise<any> {
    try {
      const user = await UserRepository.getUserByUserId(req.params.userId);
      if(!user) {
        return res.status(404).json({
          statusCode: 404,
          success: true,
          statusText: "Usuario no encontrado",
          data: null
        });
      }

       const formattedUser = {
         _id: user._id,
         identification: user.identification,
         firstName: user.firstName,
         lastName: user.lastName,
         phone: user.phone,
         email: user.email,
         createdAt: moment(user.createdAt).format("YYYY-MM-DD HH:mm:ss")
       };
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: "Usuario encontrado",
        data: formattedUser
      });

    } catch (error: any) {
      return res.status(500).json({ statusCode: 500, success: false, statusText: error.message, data:null });
    }
  }

  static async revokeUserTokens(req: Request, res: Response):Promise<any> {
    try {
      await UserRepository.revokeUserTokens(req.params.userId);
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: "Tokens revocados",
        data:null
      });

    } catch (error:any) {
      return res.status(400).json({ statusCode: 400, success: false, statusText: error.message, data:null });
    }
  }

  static async registerUser(req: Request, res: Response):Promise<any> {
    try {
      await UserRepository.registerUser(req.body);

      const users = await UserRepository.getUsers();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: "Usuario registrado",
        data:users
      });

    } catch (error:any) {
      return res.status(400).json({ statusCode: 400, success: false, statusText: error.message, data:null });
    }
  }

  static async updateUser(req: Request, res: Response):Promise<any> {
    try {
      const userId = req.params.userId;

      const updatedUser = await UserRepository.updateUserById(userId, req.body);
      if(!updatedUser) {
        return res.status(500).json({
          statusCode: 500,
          success: false,
          statusText: "Error al actualizar el usuario",
          data: null
        });
      }

      const users = await UserRepository.getUsers();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Usuario actualizado",
        data:users
      });

    } catch (error:any) {
      return res.status(500).json({ statusCode: 500, success: false, statusText: error.message, data:null });
    }
  }

  static async deleteUser(req: Request, res: Response):Promise<any> {
    try {
      const userId = req.params.userId;

      const user = await UserRepository.getExistsUserById(userId);
      if(!user) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          statusText: "Usuario no encontrado",
          data: null
        });
      }

      const updatedUser = await UserRepository.softDeleteUser(userId);
      if(!updatedUser) {
        return res.status(500).json({
          statusCode: 500,
          success: false,
          statusText: "Error al eliminar usuario",
          data: null
        });
      }

      await UserRepository.revokeUserTokens(userId);

      const users = await UserRepository.getUsers();
      return res.status(200).json({
        statusCode: 200,
        success: true,
        statusText: "Usuario eliminado",
        data:users
      });

    } catch (error:any) {
      return res.status(500).json({ statusCode: 500, success: false, statusText: error.message, data:null });
    }
  }

}