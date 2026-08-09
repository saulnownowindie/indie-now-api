import prisma from "../../config/prisma.js";
import supabase from "../../config/supabase.js";

const BUCKET = "news-covers";

export const createImageMedia = async (file) => {
  const extension = file.originalname
    .split(".")
    .pop()
    .toLowerCase();

  const fileName = `${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return prisma.media.create({
    data: {
      type: "IMAGE",
      filename: fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: publicUrlData.publicUrl,
    },
  });
};