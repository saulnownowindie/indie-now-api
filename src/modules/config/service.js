import prisma from "../../config/prisma.js";

const CONFIG_ID = 1;

export const getSiteConfig = async () => {
  return prisma.siteConfig.upsert({
    where: { id: CONFIG_ID },
    update: {},
    create: { id: CONFIG_ID },
  });
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
