export const HOME_SECTIONS = [
  "LO_NUEVO",
  "NOTICIAS",
  "REELS",
  "NO_PODES_PERDERTE",
];

export const parseHomeSection = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const section = String(value).trim().toUpperCase();

  return HOME_SECTIONS.includes(section) ? section : null;
};
