import "dotenv/config";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";

const server = app.listen(0);

await new Promise((resolve) => server.once("listening", resolve));

const { port } = server.address();
const endpoints = [
  "/api/health",
  "/api/news",
  "/api/videos",
  "/api/live-sessions",
  "/api/playlists",
  "/api/categories",
  "/api/media",
  "/api/reels",
  "/api/merch",
];

let failed = false;

for (const endpoint of endpoints) {
  const response = await fetch(`http://127.0.0.1:${port}${endpoint}`);
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
  "/api/reels",
  "/api/merch",
];

for (const endpoint of protectedPosts) {
  const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  console.log(`${response.status} POST ${endpoint} (sin token)`);

  if (response.status !== 401) {
    failed = true;
  }
}

const [reels, merch] = await Promise.all([
  prisma.reel.count(),
  prisma.merch.count(),
]);

console.log(`Reel rows: ${reels}`);
console.log(`Merch rows: ${merch}`);
console.log(failed ? "SMOKE TEST FAILED" : "SMOKE TEST OK");

server.close();
await prisma.$disconnect();

process.exit(failed ? 1 : 0);
