import prisma from "../config/prisma.js";
import { generateSlug } from "../utils/slug.js";

export const getAllPosts = async () => {
  return prisma.post.findMany({
    include: {
      category: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const getPostBySlug = async (slug) => {
  return prisma.post.findUnique({
    where: { slug },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      socialLinks: true,
    },
  });
};

export const createPost = async (data) => {
  const slug = generateSlug(data.title);

  return prisma.post.create({
    data: {
      ...data,
      slug,
    },
    include: {
      category: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      socialLinks: true,
    },
  });
};