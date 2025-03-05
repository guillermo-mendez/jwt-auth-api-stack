import {Request, Response} from 'express';
import moment from "moment";
import {UserRepository} from "../repositories/UserRepository";


export class UserController {


  static async getUsers(req: Request, res: Response) {
    try {
      const users = await UserRepository.getUsers();
      res.status(200).json({statusCode: 200, success: true, message: "Usuario encontrado", data: users});
    } catch (error: any) {
      res.status(400).json({ statusCode: 400, success: false, message: error.message, data:null });
    }
  }

  static async getUserByUserId(req: Request, res: Response) {
    try {
      const user = await UserRepository.getUserByUserId(req.params.userId);
      if(!user) {
        res.status(404).json({statusCode: 404, success: true, message: "Usuario no encontrado", data: null});
        return;
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
      res.status(200).json({statusCode: 200, success: true, message: "Usuario encontrado", data: formattedUser});

    } catch (error: any) {
      res.status(500).json({ statusCode: 500, success: false, message: error.message, data:null });
    }
  }

  static async revokeUserTokens(req: Request, res: Response) {
    try {
      await UserRepository.revokeUserTokens(req.params.userId);
      res.status(200).json({ statusCode: 200, success: true, message: "Tokens revocados", data:null });
    } catch (error:any) {
      res.status(400).json({ statusCode: 400, success: false, message: error.message, data:null });
    }
  }

  static async registerUser(req: Request, res: Response) {
    try {
      await UserRepository.registerUser(req.body);

      const users = await UserRepository.getUsers();
      res.status(200).json({ statusCode: 200, success: true, message: "Usuario registrado", data:users });

    } catch (error:any) {
      res.status(400).json({ statusCode: 400, success: false, message: error.message, data:null });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;

      const updatedUser = await UserRepository.updateUserById(userId, req.body);
      if(!updatedUser) {
        res.status(500).json({statusCode: 500, success: false, message: "Error al actualizar el usuario", data: null});
        return;
      }

      const users = await UserRepository.getUsers();
      res.status(200).json({ statusCode: 200, success: true, message: "Usuario actualizado", data:users });

    } catch (error:any) {
      res.status(500).json({ statusCode: 500, success: false, message: error.message, data:null });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;

      const user = await UserRepository.getExistsUserById(userId);
      if(!user) {
        res.status(404).json({statusCode: 404, success: false, message: "Usuario no encontrado", data: null});
        return;
      }

      const updatedUser = await UserRepository.softDeleteUser(userId);
      if(!updatedUser) {
        res.status(500).json({statusCode: 500, success: false, message: "Error al eliminar usuario", data: null});
        return;
      }

      await UserRepository.revokeUserTokens(userId);

      const users = await UserRepository.getUsers();
      res.status(200).json({ statusCode: 200, success: true, message: "Usuario eliminado", data:users });

    } catch (error:any) {
      res.status(500).json({ statusCode: 500, success: false, message: error.message, data:null });
    }
  }

}