import prisma from "../../config/prisma.js";

const CONFIG_ID = 1;

export const getSiteConfig = async () => {
  let config = await prisma.siteConfig.findUnique({
    where: { id: CONFIG_ID },
  });

  if (!config) {
    config = await prisma.siteConfig.create({
      data: { id: CONFIG_ID },
    });
  }

  return config;
};

export const updateSiteConfig = async (data) => {
  return prisma.siteConfig.upsert({
    where: { id: CONFIG_ID },
    update: data,
    create: {
      id: CONFIG_ID,
      ...data,
    },
  });
};
