import prisma from "../../config/prisma.js";

const ABANDONED_AFTER_MS = 15 * 60 * 1000;

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

export async function releaseAbandonedPreviews() {
  return prisma.reel.updateMany({
    where: {
      previewStatus: "processing",
      processingAt: {
        lt: new Date(Date.now() - ABANDONED_AFTER_MS),
      },
    },
    data: {
      previewStatus: "pending",
      processingAt: null,
    },
  });
}

export async function claimPendingPreviews(limit = 5) {
  await releaseAbandonedPreviews();

  return prisma.$queryRaw`
    UPDATE "Reel"
    SET "previewStatus" = 'processing', "processingAt" = NOW()
    WHERE "id" IN (
      SELECT "id"
      FROM "Reel"
      WHERE "previewStatus" = 'pending'
      ORDER BY "updatedAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING
      "id",
      "url",
      "previewStart",
      "previewStatus",
      "processingAt"
  `;
}

export async function completePreview(
  id,
  { previewUrl, posterUrl, status },
) {
  const reel = await prisma.reel.findUnique({
    where: { id },
    select: {
      id: true,
      previewStatus: true,
      coverImageId: true,
      coverUrl: true,
    },
  });

  if (!reel) {
    throw httpError("Reel no encontrado.", 404);
  }

  if (reel.previewStatus !== "processing") {
    throw httpError(
      "El reel no está en procesamiento para este worker.",
      409,
    );
  }

  if (status === "ready" && !previewUrl) {
    throw httpError(
      "Para marcar el preview como listo se requiere previewUrl.",
      400,
    );
  }

  const data = {
    previewStatus: status,
    processingAt: null,
  };

  if (previewUrl) {
    data.previewUrl = previewUrl;
  }

  if (posterUrl) {
    data.posterUrl = posterUrl;

    if (!reel.coverImageId && !reel.coverUrl) {
      data.coverUrl = posterUrl;
    }
  }

  const { count } = await prisma.reel.updateMany({
    where: { id, previewStatus: "processing" },
    data,
  });

  if (count === 0) {
    throw httpError(
      "Otro worker ya procesó este reel.",
      409,
    );
  }

  return prisma.reel.findUnique({ where: { id } });
}
