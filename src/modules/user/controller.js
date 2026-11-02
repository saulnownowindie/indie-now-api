import { createUser, deleteUser, getAllUsers, updateUser } from "./service.js";
import { createUserSchema, updateUserSchema } from "./validation.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const postUser = async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await createUser(data);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const putUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "El identificador debe ser válido",
      });
    }

    const data = updateUserSchema.parse(req.body);
    const user = await updateUser(id, data);

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const removeUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "El identificador debe ser válido",
      });
    }

    if (id === req.user.id) {
      return res.status(400).json({
        message: "No puedes eliminar tu propio usuario",
      });
    }

    await deleteUser(id);

    res.json({
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
};
