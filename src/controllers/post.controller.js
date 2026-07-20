import {
  getAllPosts,
  getPostBySlug,
  createPost,
} from "../services/post.service.js";

import { postSchema } from "../validators/post.validator.js";

export const getPosts = async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener publicaciones",
    });
  }
};

export const getPost = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await getPostBySlug(slug);

    if (!post) {
      return res.status(404).json({
        message: "Publicación no encontrada",
      });
    }

    res.json(post);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener publicación",
    });
  }
};

export const postPost = async (req, res) => {
  try {
    const data = postSchema.parse(req.body);

    data.authorId = req.user.id;

    const post = await createPost(data);

    res.status(201).json(post);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al crear publicación",
    });
  }
};
