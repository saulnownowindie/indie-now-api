import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando siembra de datos (Seed)...");

  // 1. Usuario Administrador (idempotente)
const adminEmail =
  process.env.SEED_ADMIN_EMAIL || "saulnownowindie@gmail.com";

const adminRawPassword =
  process.env.SEED_ADMIN_PASSWORD || "saulnownowindie";
  const hashedPassword = await bcrypt.hash(adminRawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
    },
    create: {
      name: "Administrador Indie Now",
      email: adminEmail,
      password: hashedPassword,
    },
  });

  console.log(`✅ Usuario Administrador configurado (${admin.email})`);

  // 2. Categorías (idempotente)
  const categoriesData = [
    { name: "Noticias", slug: "noticias" },
    { name: "Lanzamientos", slug: "lanzamientos" },
    { name: "Sesiones", slug: "sesiones" },
    { name: "Reels", slug: "reels" },
    { name: "Curiosidades", slug: "curiosidades" },
    { name: "Alertas Indie", slug: "alertas-indie" },
  ];

  const categoriesMap = {};

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
    categoriesMap[cat.slug] = category;
  }

  console.log(`✅ ${categoriesData.length} Categorías configuradas.`);

  // 3. Noticias (idempotente por slug)
  const newsData = [
    {
      title: "El nuevo auge del Indie Rock Latinoamericano en 2026",
      slug: "el-nuevo-auge-del-indie-rock-latinoamericano-en-2026",
      platform: "INSTAGRAM",
      url: "https://www.instagram.com/p/C1234567890",
      featured: true,
      isVisible: true,
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-15T12:00:00Z"),
      seoTitle: "Indie Rock Latinoamericano 2026",
      seoDescription: "Descubre las bandas emergentes que están liderando la escena independiente en Latinoamérica.",
      authorId: admin.id,
      categoryId: categoriesMap["noticias"].id,
    },
    {
      title: "Bandalos Chinos anuncia nueva gira por Sudamérica",
      slug: "bandalos-chinos-anuncia-nueva-gira-por-sudamerica",
      platform: "X",
      url: "https://x.com/bandaloschinos/status/123456789",
      featured: false,
      isVisible: true,
      status: "PUBLISHED",
      publishedAt: new Date("2026-02-01T15:30:00Z"),
      seoTitle: "Bandalos Chinos Gira 2026",
      seoDescription: "Fechas y lugares confirmados para el tour sudamericano de Bandalos Chinos.",
      authorId: admin.id,
      categoryId: categoriesMap["lanzamientos"].id,
    },
  ];

  for (const newsItem of newsData) {
    await prisma.news.upsert({
      where: { slug: newsItem.slug },
      update: newsItem,
      create: newsItem,
    });
  }

  console.log(`✅ ${newsData.length} Noticias configuradas.`);

  // 4. Videos (idempotente por slug)
  const videoData = [
    {
      title: "Conociendo Rusia - La Dirección (En Vivo)",
      slug: "conociendo-rusia-la-direccion-en-vivo",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      featured: true,
      isVisible: true,
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-20T18:00:00Z"),
      seoTitle: "Conociendo Rusia En Vivo",
      seoDescription: "Presentación en vivo de La Dirección.",
      authorId: admin.id,
      categoryId: categoriesMap["sesiones"].id,
    },
    {
      title: "Top 10 Guitarras del Indie Rock",
      slug: "top-10-guitarras-del-indie-rock",
      youtubeUrl: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
      featured: false,
      isVisible: true,
      status: "PUBLISHED",
      publishedAt: new Date("2026-02-10T20:00:00Z"),
      seoTitle: "Top Guitarras Indie",
      seoDescription: "Un repaso por los riffs más icónicos del género.",
      authorId: admin.id,
      categoryId: categoriesMap["curiosidades"].id,
    },
  ];

  for (const videoItem of videoData) {
    await prisma.video.upsert({
      where: { slug: videoItem.slug },
      update: videoItem,
      create: videoItem,
    });
  }

  console.log(`✅ ${videoData.length} Videos configurados.`);

  // 5. Live Sessions (idempotente por slug)
  const liveSessionData = [
    {
      title: "Indie Now Session #01 - El Kuelgue",
      slug: "indie-now-session-01-el-kuelgue",
      youtubeUrl: "https://www.youtube.com/watch?v=L_jWHffIx5E",
      featured: true,
      isVisible: true,
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-10T21:00:00Z"),
      seoTitle: "Indie Now Session #01 El Kuelgue",
      seoDescription: "Sesión exclusiva grabada en nuestros estudios.",
      authorId: admin.id,
    },
    {
      title: "Indie Now Session #02 - Silvestre y La Naranja",
      slug: "indie-now-session-02-silvestre-y-la-naranja",
      youtubeUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
      featured: true,
      isVisible: true,
      status: "PUBLISHED",
      publishedAt: new Date("2026-02-05T21:00:00Z"),
      seoTitle: "Indie Now Session #02 Silvestre y La Naranja",
      seoDescription: "Disfruta del show íntimo de Silvestre y La Naranja.",
      authorId: admin.id,
    },
  ];

  for (const sessionItem of liveSessionData) {
    await prisma.liveSession.upsert({
      where: { slug: sessionItem.slug },
      update: sessionItem,
      create: sessionItem,
    });
  }

  console.log(`✅ ${liveSessionData.length} Live Sessions configuradas.`);

  // 6. Playlists (idempotente por spotifyId)
  const playlistData = [
    {
      spotifyId: "37i9dQZF1DXcBWIGoYBM5M",
      spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      title: "Indie Today",
      description: "Las canciones indispensables del indie rock en español e inglés.",
      coverUrl: "https://i.scdn.co/image/ab67706f00000003a2777174e9ef970c9dd9e4b7",
      ownerName: "Spotify",
      tracksCount: 50,
      spotifySnapshotId: "MCxkODVhMjgxZGM3MjVjYTFkYWIwOTc5NDQ2NGFkNDQ0Nzc4ZTk4NjQ0",
      spotifySyncedAt: new Date(),
      slug: "indie-today",
      platform: "SPOTIFY",
      featured: true,
      isVisible: true,
      sortOrder: 1,
      seoTitle: "Playlist Indie Today",
      seoDescription: "Lo mejor del indie rock actualizado constantemente.",
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      authorId: admin.id,
    },
    {
      spotifyId: "37i9dQZF1DXa2PvFpywu28",
      spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXa2PvFpywu28",
      title: "Indie Argentina",
      description: "El sonido de la escena independiente argentina.",
      coverUrl: "https://i.scdn.co/image/ab67706f000000038843916e788c03d7e7e8b615",
      ownerName: "Spotify",
      tracksCount: 65,
      spotifySnapshotId: "MCxZjJmYTA5MzQ3ZTNkYWYxYzM4NDEzMWRmZGU5MTVhNmE4YWFlMjllYg==",
      spotifySyncedAt: new Date(),
      slug: "indie-argentina",
      platform: "SPOTIFY",
      featured: true,
      isVisible: true,
      sortOrder: 2,
      seoTitle: "Playlist Indie Argentina",
      seoDescription: "Las mejores bandas de la escena independiente local.",
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-05T00:00:00Z"),
      authorId: admin.id,
    },
  ];

  for (const playlistItem of playlistData) {
    await prisma.playlist.upsert({
      where: { spotifyId: playlistItem.spotifyId },
      update: playlistItem,
      create: playlistItem,
    });
  }

  console.log(`✅ ${playlistData.length} Playlists configuradas.`);

  console.log("🚀 Siembra de datos (Seed) completada con éxito.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Error en la siembra de datos:", error);
    await prisma.$disconnect();
    process.exit(1);
  });