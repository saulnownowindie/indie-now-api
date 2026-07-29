const spotifyPlaylistIdPattern = /^[a-zA-Z0-9]{22}$/;

export const extractSpotifyPlaylistId = (value) => {
  try {
    const url = new URL(value);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.hostname.toLowerCase() !== "open.spotify.com"
    ) {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    const playlistIndex = segments.indexOf("playlist");

    if (playlistIndex === -1) {
      return null;
    }

    const playlistId = segments[playlistIndex + 1];

    if (!spotifyPlaylistIdPattern.test(playlistId ?? "")) {
      return null;
    }

    return playlistId;
  } catch {
    return null;
  }
};

export const isValidSpotifyPlaylistUrl = (value) => {
  return extractSpotifyPlaylistId(value) !== null;
};

export const normalizeSpotifyPlaylistUrl = (value) => {
  const playlistId = extractSpotifyPlaylistId(value);

  if (!playlistId) {
    return null;
  }

  return `https://open.spotify.com/playlist/${playlistId}`;
};
