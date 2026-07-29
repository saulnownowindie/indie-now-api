import {
  createPlaylist,
  deletePlaylist,
  getAllPlaylists,
  getFeaturedPlaylists,
  getPlaylistBySlug,
  syncPlaylist,
  updatePlaylist,
} from "./service.js";
import {
  createPlaylistSchema,
  playlistIdParamsSchema,
  updatePlaylistSchema,
} from "./validation.js";

export const getPlaylists = async (req, res, next) => {
  try {
    const playlists = await getAllPlaylists();

    res.json(playlists);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedPlaylistsController = async (req, res, next) => {
  try {
    const playlists = await getFeaturedPlaylists();

    res.json(playlists);
  } catch (error) {
    next(error);
  }
};

export const getPlaylistBySlugController = async (req, res, next) => {
  try {
    const playlist = await getPlaylistBySlug(req.params.slug);

    if (!playlist) {
      return res.status(404).json({
        message: "Playlist no encontrada",
      });
    }

    res.json(playlist);
  } catch (error) {
    next(error);
  }
};

export const postPlaylist = async (req, res, next) => {
  try {
    const data = createPlaylistSchema.parse(req.body);
    const playlist = await createPlaylist(data, req.user.id);

    res.status(201).json(playlist);
  } catch (error) {
    next(error);
  }
};

export const putPlaylist = async (req, res, next) => {
  try {
    const { id } = playlistIdParamsSchema.parse(req.params);
    const data = updatePlaylistSchema.parse(req.body);
    const playlist = await updatePlaylist(id, data);

    res.json(playlist);
  } catch (error) {
    next(error);
  }
};

export const syncPlaylistController = async (req, res, next) => {
  try {
    const { id } = playlistIdParamsSchema.parse(req.params);
    const playlist = await syncPlaylist(id);

    if (!playlist) {
      return res.status(404).json({
        message: "Playlist no encontrada",
      });
    }

    res.json(playlist);
  } catch (error) {
    next(error);
  }
};

export const removePlaylist = async (req, res, next) => {
  try {
    const { id } = playlistIdParamsSchema.parse(req.params);

    await deletePlaylist(id);

    res.json({
      message: "Playlist eliminada correctamente",
    });
  } catch (error) {
    next(error);
  }
};
