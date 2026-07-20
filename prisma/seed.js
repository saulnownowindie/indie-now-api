import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creando datos iniciales...");

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@indienow.com",
    },
    update: {},
    create: {
      name: "Indie Now",
      email: "admin@indienow.com",
      password: "123456",
    },
  });

  console.log("✅ Usuario administrador creado.");

  const categories = [
    { name: "Noticias", slug: "noticias" },
    { name: "Lanzamientos", slug: "lanzamientos" },
    { name: "Sesiones", slug: "sesiones" },
    { name: "Reels", slug: "reels" },
    { name: "Curiosidades", slug: "curiosidades" },
    { name: "Alertas Indie", slug: "alertas-indie" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {},
      create: category,
    });
  }

  console.log("✅ Categorías creadas.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });