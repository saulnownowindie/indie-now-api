import cloudinary from "../config/cloudinary.js";

// Sube un Buffer a Cloudinary usando upload_stream.
// Necesario porque Multer usa memoryStorage (Vercel no tiene disco persistente).
export const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        overwrite: false,
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
};

// Elimina un asset por su public_id. Útil para limpiar imágenes huérfanas.
export const deleteAsset = (publicId) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};
