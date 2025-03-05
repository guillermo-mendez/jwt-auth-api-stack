import mongoose from "mongoose";
import User from "../models/User"; // Asegúrate de que la ruta sea correcta

export const createAdminUser = async () => {
  try {

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("✔ El usuario administrador ya existe.");
      return;
    }

    // Crear un nuevo usuario administrador
    const adminUser = new User({
      identification: "123456789",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: "admin12345", // Se encriptará automáticamente con el middleware `pre("save")`
      phone: "1234567890",
      role: "admin",
      status: "active",
    });

    await adminUser.save();
    console.log("✔ Usuario administrador creado con éxito.");
  } catch (error) {
    console.error("❌ Error creando el usuario administrador:", error);
  }
};
