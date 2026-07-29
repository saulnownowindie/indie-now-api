const youtubeVideoIdPattern = /^[a-zA-Z0-9_-]{11}$/;

const getYouTubeVideoIdFromUrl = (url) => {
  if (!["http:", "https:"].includes(url.protocol)) {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

  if (hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (hostname !== "youtube.com" && hostname !== "m.youtube.com") {
    return null;
  }

  if (url.pathname === "/watch") {
    return url.searchParams.get("v");
  }

  const [resource, videoId] = url.pathname.split("/").filter(Boolean);

  if (["shorts", "embed", "live"].includes(resource)) {
    return videoId ?? null;
  }

  return null;
};

export const extractYouTubeVideoId = (value) => {
  try {
    const url = new URL(value);
    const videoId = getYouTubeVideoIdFromUrl(url);

    return youtubeVideoIdPattern.test(videoId ?? "") ? videoId : null;
  } catch {
    return null;
  }
};

export const isValidYouTubeUrl = (value) => {
  return extractYouTubeVideoId(value) !== null;
};

export const normalizeYouTubeUrl = (value) => {
  const videoId = extractYouTubeVideoId(value);

  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
};
