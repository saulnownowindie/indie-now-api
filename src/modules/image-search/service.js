import fetch from "node-fetch";
import { parse } from "node-html-parser";
import cloudinary from "../../config/cloudinary.js";
import prisma from "../../config/prisma.js";

async function extractOgImage(url) {
  try {
    const res = await fetch(url, { timeout: 5000, headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const html = await res.text();
    const root = parse(html);
    const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (ogImage && ogImage.includes("instagram.com/static")) return null;
    return ogImage || null;
  } catch (error) {
    return null;
  }
}

async function searchUnsplash(query) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${accessKey}` }
    });
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch (error) {
    return null;
  }
}

function generatePollinationsImage(prompt) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " music indie aesthetic")}?width=1200&height=800&nologo=true`;
}

export async function findBestImage(title, url) {
  let imageUrl = null;

  if (url) imageUrl = await extractOgImage(url);
  if (!imageUrl) imageUrl = await searchUnsplash(title);
  if (!imageUrl) imageUrl = generatePollinationsImage(title);

  if (!imageUrl) return null;

  try {
    const uploaded = await cloudinary.uploader.upload(imageUrl, {
      folder: "news-covers",
      resource_type: "image",
      timeout: 10000
    });

    const media = await prisma.media.create({
      data: {
        type: "IMAGE",
        filename: uploaded.public_id,
        originalName: `${title.substring(0, 20)}...`,
        mimeType: "image/jpeg",
        size: uploaded.bytes || 0,
        url: uploaded.secure_url,
      }
    });

    return { url: media.url, mediaId: media.id };
  } catch (error) {
    console.error("Cloudinary falló, usando URL directa:", error);
    return { url: imageUrl, mediaId: null };
  }
}