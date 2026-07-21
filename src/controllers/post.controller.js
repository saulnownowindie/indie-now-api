import {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from "../services/post.service.js";
import { postSchema } from "../validators/post.validator.js";

export const getPosts = async (req, res, next) => {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

export const getPost = async (req, res, next) => {
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
    next(error);
  }
};

export const postPost = async (req, res, next) => {
  try {
    const data = postSchema.parse(req.body);

    data.authorId = req.user.id;

    const post = await createPost(data);

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

export const putPost = async (req, res, next) => {
  try {
    const data = postSchema.parse(req.body);

    data.authorId = req.user.id;

    const post = await updatePost(req.params.id, data);

    res.json(post);
  } catch (error) {
    next(error);
  }
};

export const removePost = async (req, res, next) => {
  try {
    await deletePost(req.params.id);

    res.json({
      message: "Publicación eliminada correctamente",
    });
  } catch (error) {
    next(error);
  }
};
