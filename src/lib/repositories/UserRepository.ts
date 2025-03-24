import User, {IUser} from "../../models/User";
import moment from "moment/moment";
import Session from "../../models/Session";


export class UserRepository {

  static async getUsers() {
    // excluir __v, password, updatedAt,role
    // lean() convierte el documento de mongoose a un objeto plano de JavaScript
    // const users = await User.find().sort({ name: 1 }); // 1 Orden ascendente (A-Z)
    // const users = await User.find().sort({ createdAt: -1 }); // -1 Orden descendente (más recientes primero)
    const users = await User.find({deletedAt: null})
      .select("-__v -password -updatedAt -deletedAt -role")
      .sort({createdAt: -1})
      .lean();

    return users.map(user => ({
      ...user,
      createdAt: moment(user.createdAt).format("DD-MM-YYYY HH:mm:ss")
    }));
  }

  static async getUserByUserId(userId: string) {
    return User.findOne({_id: userId, deletedAt: null}).select("-__v -password -updatedAt -deletedAt -role").lean();
  }

  /**
   * Incrementa el tokenVersion del usuario, revocando todos los tokens emitidos con la versión anterior.
   * @param userId - ID del usuario.
   * @returns El usuario actualizado.
   */
  static async revokeUserTokens(userId: string): Promise<IUser | null> {
    const user = await User.findById(userId).select("tokenVersion");
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return User.findByIdAndUpdate(
      userId,
      { $inc: { tokenVersion: 1 } }, // Incrementa el tokenVersion
      {new: true});
  }


  static async getUserByEmail(email: string) {
    return User.findOne({email, deletedAt: null});
  }

  /**
   * Registra un nuevo usuario (con email y password en texto plano),
   * validando que no exista ya y devolviendo el usuario creado.
   * @param userData - Datos del usuario a crear
   * @returns El documento del usuario creado (sin password en texto plano)
   * @throws Error si el email ya existe
   */
  static async registerUser(userData: Partial<IUser>) {
    const { identification,email } = userData;

    // Verificar si el usuario ya existe
    const existingUser = await this.userExists(identification,email);
    if (existingUser){
      console.log("Error: El usuario ya existe con ese email, username o identificación");
      throw new Error("El usuario ya está registrado");
    }

    // Crear usuario
    const newUser = new User(userData);
    await newUser.save();
    return newUser;
  }

  static async updateUserById(userId: string, updateData: {
    identification: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) {
    const { identification } = updateData;

    const user = await this.getExistsUserById(userId);
    if(!user) {
      throw new Error("Usuario no encontrado");
    }

    const exists = await UserRepository.userExistsBeforeUpdate(userId,identification || '');
    if (exists) {
      console.log("Error: El usuario ya existe con esa identificación");
      throw new Error("Identificación en uso por otro usuario");
    }

    return User.findByIdAndUpdate(userId, updateData, {new: true});
  }

  static async softDeleteUser(userId: string) {
    await Session.deleteMany({userId});
    return User.findByIdAndUpdate(userId, {deletedAt: new Date(), status: 'inactive'}, {new: true});
  };

  static async userExists(identification?: string, email?: string) {
    const existingUser = await User.findOne({
      $or: [
        { identification },
        { email }
      ],
      deletedAt: null // Solo traer usuarios activos (NO eliminados)
    });

    return existingUser !== null; // Devuelve true si el usuario ya existe y no está eliminado
  }

  static async userExistsBeforeUpdate(userId: string, identification: string) {
    const existingUser = await User.findOne({
      $or: [{ identification }], // Busca si ya existe el email o identificación
      _id: { $ne: userId } // Excluye al usuario actual (el que se va a actualizar)
    });

    return existingUser !== null; // Devuelve true si hay conflicto
  };

  static async getExistsUserById(userId: string) {
    return User.exists({_id: userId, deletedAt: null});
  }

  static async getUserById(userId: string) {
    return User.exists({_id: userId, deletedAt: null});
  }

}