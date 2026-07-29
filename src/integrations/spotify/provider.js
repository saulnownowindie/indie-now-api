const spotifyTokenUrl = "https://accounts.spotify.com/api/token";
const spotifyApiUrl = "https://api.spotify.com/v1";

let accessToken;
let accessTokenExpiresAt = 0;

export class SpotifyProviderError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "SpotifyProviderError";
    this.statusCode = statusCode;
  }
}

const getSpotifyCredentials = () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new SpotifyProviderError(
      "La integración con Spotify no está configurada.",
      503
    );
  }

  return { clientId, clientSecret };
};

const getAccessToken = async () => {
  if (accessToken && Date.now() < accessTokenExpiresAt) {
    return accessToken;
  }

  const { clientId, clientSecret } = getSpotifyCredentials();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  let response;

  try {
    response = await fetch(spotifyTokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
  } catch {
    throw new SpotifyProviderError("No fue posible conectar con Spotify.");
  }

  if (!response.ok) {
    throw new SpotifyProviderError("No fue posible autenticar con Spotify.");
  }

  const data = await response.json();

  accessToken = data.access_token;
  accessTokenExpiresAt = Date.now() + Math.max(data.expires_in - 60, 0) * 1000;

  return accessToken;
};

const getProviderError = (status) => {
  if (status === 404) {
    return new SpotifyProviderError("Playlist de Spotify no encontrada.", 404);
  }

  if (status === 429) {
    return new SpotifyProviderError(
      "Spotify limitó temporalmente las solicitudes. Intenta nuevamente más tarde.",
      503
    );
  }

  return new SpotifyProviderError("No fue posible obtener la información de Spotify.");
};

export const getSpotifyPlaylistMetadata = async (spotifyId) => {
  const token = await getAccessToken();
  const fields = [
    "id",
    "name",
    "description",
    "images",
    "owner(display_name)",
    "tracks(total)",
    "snapshot_id",
  ].join(",");

  let response;

  try {
    response = await fetch(`${spotifyApiUrl}/playlists/${spotifyId}?fields=${fields}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new SpotifyProviderError("No fue posible conectar con Spotify.");
  }

  if (!response.ok) {
    throw getProviderError(response.status);
  }

  const data = await response.json();

  if (!data.id || !data.name) {
    throw new SpotifyProviderError("Spotify devolvió una playlist inválida.");
  }

  return {
    spotifyId: data.id,
    title: data.name,
    description: data.description ?? null,
    coverUrl: data.images?.[0]?.url ?? null,
    ownerName: data.owner?.display_name ?? null,
    tracksCount: data.tracks?.total ?? null,
    spotifySnapshotId: data.snapshot_id ?? null,
  };
};
