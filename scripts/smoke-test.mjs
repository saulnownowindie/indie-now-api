import "dotenv/config";
import jwt from "jsonwebtoken";

process.env.WORKER_TOKEN ||= "smoke-worker-token";

const { default: app } = await import("../src/app.js");
const { default: prisma } = await import("../src/config/prisma.js");

const server = app.listen(0);

await new Promise((resolve) => server.once("listening", resolve));

const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const endpoints = [
  "/api/health",
  "/api/news",
  "/api/news/public",
  "/api/news/public?section=NOTICIAS",
  "/api/videos",
  "/api/live-sessions",
  "/api/playlists",
  "/api/categories",
  "/api/reels",
  "/api/reels/public",
  "/api/reels/public?section=REELS",
  "/api/merch",
];

const protectedReads = [
  "/api/media",
  "/api/media/1",
  "/api/users",
  "/api/admin/news",
  "/api/admin/reels",
  "/api/admin/videos",
  "/api/admin/live-sessions",
  "/api/admin/merch",
  "/api/admin/playlists",
];

let failed = false;

for (const endpoint of endpoints) {
  const response = await fetch(`${base}${endpoint}`);
  console.log(`${response.status} ${endpoint}`);

  if (!response.ok) {
    failed = true;
  }
}

for (const endpoint of protectedReads) {
  const response = await fetch(`${base}${endpoint}`);
  console.log(`${response.status} ${endpoint} (sin token)`);

  if (response.status !== 401) {
    failed = true;
  }
}

async function checkPublicPayloads() {
  const publicNews = await (await fetch(`${base}/api/news`)).json();
  const publicReels = await (await fetch(`${base}/api/reels`)).json();
  const publicVideos = await (await fetch(`${base}/api/videos`)).json();
  const publicSessions = await (
    await fetch(`${base}/api/live-sessions`)
  ).json();
  const publicMerch = await (await fetch(`${base}/api/merch`)).json();
  const publicPlaylists = await (
    await fetch(`${base}/api/playlists`)
  ).json();

  const collections = [
    ["news", publicNews],
    ["reels", publicReels],
    ["videos", publicVideos],
    ["live-sessions", publicSessions],
    ["merch", publicMerch],
    ["playlists", publicPlaylists],
  ];

  for (const [name, rows] of collections) {
    if (!Array.isArray(rows)) {
      console.log(`FAIL ${name}: la respuesta pública no es un arreglo`);
      failed = true;
      continue;
    }

    for (const row of rows) {
      if (row.author?.email) {
        console.log(`FAIL ${name}: se expone author.email en "${row.slug}"`);
        failed = true;
      }

      if (row.coverImage?.size !== undefined) {
        console.log(`FAIL ${name}: se expone coverImage.size en "${row.slug}"`);
        failed = true;
      }

      if ("content" in row) {
        console.log(`FAIL ${name}: se expone content en el listado "${row.slug}"`);
        failed = true;
      }
    }
  }

  const hiddenNews = await prisma.news.findMany({
    where: {
      OR: [{ status: { not: "PUBLISHED" } }, { isVisible: false }],
    },
    select: { slug: true },
  });

  const publicNewsSlugs = new Set(publicNews.map((row) => row.slug));

  for (const { slug } of hiddenNews) {
    if (publicNewsSlugs.has(slug)) {
      console.log(`FAIL news: borrador visible públicamente (${slug})`);
      failed = true;
    }
  }

  if (hiddenNews[0]) {
    const detail = await fetch(`${base}/api/news/${hiddenNews[0].slug}`);
    console.log(`${detail.status} GET /api/news/${hiddenNews[0].slug} (borrador)`);

    if (detail.status !== 404) {
      failed = true;
    }
  }

  const hiddenReels = await prisma.reel.findMany({
    where: {
      OR: [{ status: { not: "PUBLISHED" } }, { isVisible: false }],
    },
    select: { slug: true },
  });

  const publicReelSlugs = new Set(publicReels.map((row) => row.slug));

  for (const { slug } of hiddenReels) {
    if (publicReelSlugs.has(slug)) {
      console.log(`FAIL reels: borrador visible públicamente (${slug})`);
      failed = true;
    }
  }
}

async function checkDraftIsolation() {
  const author = await prisma.user.findFirst({ select: { id: true } });

  if (!author) {
    console.log("SKIP draft isolation: no hay usuarios en la base.");
    return;
  }

  const stamp = Date.now();
  let category = await prisma.category.findFirst({ select: { id: true } });
  let createdCategory = false;

  if (!category) {
    category = await prisma.category.create({
      data: { name: `Smoke category ${stamp}`, slug: `smoke-category-${stamp}` },
      select: { id: true },
    });
    createdCategory = true;
  }

  const draft = await prisma.news.create({
    data: {
      title: `Smoke draft ${stamp}`,
      slug: `smoke-draft-${stamp}`,
      platform: "OTHER",
      url: `https://example.com/smoke-draft-${stamp}`,
      categoryId: category.id,
      authorId: author.id,
      status: "DRAFT",
      isVisible: true,
    },
    select: { id: true, slug: true },
  });

  const hidden = await prisma.news.create({
    data: {
      title: `Smoke hidden ${stamp}`,
      slug: `smoke-hidden-${stamp}`,
      platform: "OTHER",
      url: `https://example.com/smoke-hidden-${stamp}`,
      categoryId: category.id,
      authorId: author.id,
      status: "PUBLISHED",
      isVisible: false,
    },
    select: { id: true, slug: true },
  });

  const hiddenReel = await prisma.reel.create({
    data: {
      title: `Smoke hidden reel ${stamp}`,
      slug: `smoke-hidden-reel-${stamp}`,
      platform: "OTHER",
      url: `https://example.com/smoke-hidden-reel-${stamp}`,
      authorId: author.id,
      status: "PUBLISHED",
      isVisible: false,
    },
    select: { id: true, slug: true },
  });

  try {
    const newsList = await (await fetch(`${base}/api/news`)).json();
    const reelList = await (await fetch(`${base}/api/reels`)).json();

    const leaked = [
      ...newsList.filter((row) =>
        [draft.slug, hidden.slug].includes(row.slug),
      ),
      ...reelList.filter((row) => row.slug === hiddenReel.slug),
    ];

    if (leaked.length > 0) {
      console.log(
        `FAIL draft isolation: ${leaked.map((row) => row.slug).join(", ")}`,
      );
      failed = true;
    } else {
      console.log("OK draft isolation: borradores y ocultos no aparecen");
    }

    for (const [endpoint, slug] of [
      ["news", draft.slug],
      ["news", hidden.slug],
      ["reels", hiddenReel.slug],
    ]) {
      const response = await fetch(`${base}/api/${endpoint}/${slug}`);
      console.log(`${response.status} GET /api/${endpoint}/${slug} (oculto)`);

      if (response.status !== 404) {
        failed = true;
      }
    }
  } finally {
    await prisma.news.deleteMany({
      where: { id: { in: [draft.id, hidden.id] } },
    });
    await prisma.reel.deleteMany({ where: { id: hiddenReel.id } });
    if (createdCategory) {
      await prisma.category.delete({ where: { id: category.id } });
    }
  }
}

async function checkAdminAccess() {
  const author = await prisma.user.findFirst({
    select: { id: true, email: true },
  });

  if (!author || !process.env.JWT_SECRET) {
    console.log("SKIP admin read tests: faltan usuario o JWT_SECRET.");
    return;
  }

  const token = jwt.sign(
    { id: author.id, email: author.email },
    process.env.JWT_SECRET,
    { expiresIn: "5m" },
  );

  for (const endpoint of protectedReads.filter((path) =>
    path.startsWith("/api/admin/"),
  )) {
    const response = await fetch(`${base}${endpoint}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    console.log(`${response.status} ${endpoint} (con token)`);

    if (response.status !== 200) {
      failed = true;
    }
  }
}

const protectedPosts = [
  "/api/news",
  "/api/videos",
  "/api/live-sessions",
  "/api/playlists",
  "/api/categories",
  "/api/media",
  "/api/media/signature",
  "/api/reels",
  "/api/merch",
  "/api/utils/extract-cover",
];

for (const endpoint of protectedPosts) {
  const response = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  console.log(`${response.status} POST ${endpoint} (sin token)`);

  if (response.status !== 401) {
    failed = true;
  }
}

const workerToken = process.env.WORKER_TOKEN;
const workerHeaders = {
  authorization: `Bearer ${workerToken}`,
};

async function checkWorkerEndpoints() {
  const noToken = await fetch(`${base}/api/worker/pending-previews`);
  console.log(`${noToken.status} GET /api/worker/pending-previews (sin token)`);

  if (noToken.status !== 401) {
    failed = true;
  }

  const badToken = await fetch(`${base}/api/worker/pending-previews`, {
    headers: { authorization: "Bearer token-invalido" },
  });
  console.log(`${badToken.status} GET /api/worker/pending-previews (token inválido)`);

  if (badToken.status !== 401) {
    failed = true;
  }

  const author = await prisma.user.findFirst({ select: { id: true } });
  const pendingPreviews = await prisma.reel.count({
    where: {
      previewStatus: { in: ["pending", "processing"] },
    },
  });

  if (!author) {
    console.log("SKIP worker claim tests: no hay usuarios en la base.");
    return;
  }

  if (pendingPreviews > 0) {
    console.log(
      "SKIP worker claim tests: ya existen previews pendientes o en proceso.",
    );
    return;
  }

  const stamp = Date.now();
  const created = [];

  for (let index = 0; index < 2; index += 1) {
    created.push(
      await prisma.reel.create({
        data: {
          title: `Smoke preview ${stamp} ${index}`,
          slug: `smoke-preview-${stamp}-${index}`,
          platform: "YOUTUBE",
          url: `https://www.youtube.com/shorts/smoke${stamp}${index}`,
          authorId: author.id,
          previewStatus: "pending",
          previewStart: 1.5,
        },
      }),
    );
  }

  const ids = created.map((reel) => reel.id);

  try {
    const first = await fetch(
      `${base}/api/worker/pending-previews?limit=2`,
      { headers: workerHeaders },
    );
    const firstBody = await first.json();
    console.log(
      `${first.status} GET /api/worker/pending-previews?limit=2 (claim 1): ${firstBody.count}`,
    );

    if (
      first.status !== 200 ||
      firstBody.count !== 2 ||
      !ids.every((id) => firstBody.reels.some((reel) => reel.id === id))
    ) {
      failed = true;
    }

    const second = await fetch(
      `${base}/api/worker/pending-previews?limit=2`,
      { headers: workerHeaders },
    );
    const secondBody = await second.json();
    console.log(
      `${second.status} GET /api/worker/pending-previews?limit=2 (claim 2): ${secondBody.count}`,
    );

    if (second.status !== 200 || secondBody.count !== 0) {
      failed = true;
    }

    await prisma.reel.update({
      where: { id: ids[0] },
      data: {
        previewStatus: "processing",
        processingAt: new Date(Date.now() - 16 * 60 * 1000),
      },
    });

    const release = await fetch(
      `${base}/api/worker/pending-previews?limit=1`,
      { headers: workerHeaders },
    );
    const releaseBody = await release.json();
    const reclaimed = releaseBody.reels?.[0];
    console.log(
      `${release.status} GET /api/worker/pending-previews?limit=1 (abandonado): ${releaseBody.count}`,
    );

    if (
      release.status !== 200 ||
      releaseBody.count !== 1 ||
      reclaimed?.id !== ids[0]
    ) {
      failed = true;
    }

    const failedPatch = await fetch(
      `${base}/api/worker/reels/${ids[0]}/preview`,
      {
        method: "PATCH",
        headers: {
          ...workerHeaders,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "failed" }),
      },
    );
    console.log(
      `${failedPatch.status} PATCH /api/worker/reels/:id/preview (failed)`,
    );

    if (failedPatch.status !== 200) {
      failed = true;
    }

    const repeatedPatch = await fetch(
      `${base}/api/worker/reels/${ids[0]}/preview`,
      {
        method: "PATCH",
        headers: {
          ...workerHeaders,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "failed" }),
      },
    );
    console.log(
      `${repeatedPatch.status} PATCH /api/worker/reels/:id/preview (repetido)`,
    );

    if (repeatedPatch.status !== 409) {
      failed = true;
    }
  } finally {
    await prisma.reel.deleteMany({ where: { id: { in: ids } } });
  }
}

try {
  await checkPublicPayloads();
  await checkDraftIsolation();
  await checkAdminAccess();
  await checkWorkerEndpoints();

  const [reels, merch] = await Promise.all([
    prisma.reel.count(),
    prisma.merch.count(),
  ]);

  console.log(`Reel rows: ${reels}`);
  console.log(`Merch rows: ${merch}`);
  console.log(failed ? "SMOKE TEST FAILED" : "SMOKE TEST OK");
} catch (error) {
  console.error(error);
  failed = true;
} finally {
  server.close();
  await prisma.$disconnect();
}

process.exit(failed ? 1 : 0);
