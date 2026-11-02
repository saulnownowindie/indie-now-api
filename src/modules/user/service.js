import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
};

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });
};

export const createUser = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      avatarUrl: data.avatarUrl ?? null,
    },
    select: userSelect,
  });
};

export const deleteUser = async (id) => {
  return prisma.user.delete({
    where: { id },
  });
};
