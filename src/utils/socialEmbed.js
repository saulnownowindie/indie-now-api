import { extractYouTubeVideoId } from "./youtube.js";

const clean = (value) => String(value ?? "").trim();

export function detectSocialPlatform(value) {
  try {
    const url = new URL(clean(value));
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtu.be"
    ) {
      return "YOUTUBE";
    }

    if (hostname === "instagram.com") {
      return "INSTAGRAM";
    }

    if (
      hostname === "tiktok.com" ||
      hostname === "m.tiktok.com" ||
      hostname === "vm.tiktok.com" ||
      hostname === "vt.tiktok.com"
    ) {
      return "TIKTOK";
    }

    return null;
  } catch {
    return null;
  }
}

function getInstagramResource(url) {
  const match = url.pathname.match(
    /\/(reel|reels|p|tv)\/([^/?#]+)/i,
  );

  if (!match) {
    return null;
  }

  return {
    type: match[1].toLowerCase() === "reels" ? "reel" : match[1].toLowerCase(),
    code: match[2],
  };
}

function getTikTokVideoId(url) {
  const match = url.pathname.match(/\/video\/(\d+)/);

  return match ? match[1] : null;
}

export function getSocialEmbedUrl(value, platform) {
  const resolvedPlatform = platform || detectSocialPlatform(value);

  let url;

  try {
    url = new URL(clean(value));
  } catch {
    return null;
  }

  if (resolvedPlatform === "YOUTUBE") {
    const videoId = extractYouTubeVideoId(value);

    return videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : null;
  }

  if (resolvedPlatform === "INSTAGRAM") {
    const resource = getInstagramResource(url);

    return resource
      ? `https://www.instagram.com/${resource.type}/${resource.code}/embed`
      : null;
  }

  if (resolvedPlatform === "TIKTOK") {
    const videoId = getTikTokVideoId(url);

    return videoId
      ? `https://www.tiktok.com/embed/v2/${videoId}`
      : null;
  }

  return null;
}
