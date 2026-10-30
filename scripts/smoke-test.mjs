import "dotenv/config";

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
  "/api/media",
  "/api/reels",
  "/api/reels/public",
  "/api/reels/public?section=REELS",
  "/api/merch",
];

let failed = false;

for (const endpoint of endpoints) {
  const response = await fetch(`${base}${endpoint}`);
  console.log(`${response.status} ${endpoint}`);

  if (!response.ok) {
    failed = true;
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
