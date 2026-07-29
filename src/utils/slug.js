import slugify from "slugify";

export const generateSlug = (title) => {
  return slugify(title, {
    lower: true,
    strict: true,
    locale: "es",
    trim: true,
  });
};

export const generateUniqueSlug = async (
  title,
  { fallback, isSlugTaken }
) => {
  const baseSlug = generateSlug(title) || fallback;
  let slug = baseSlug;
  let suffix = 2;

  while (await isSlugTaken(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};
