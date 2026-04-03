export const XP_PER_LEVEL = 1000;

const normalizeXp = (xp: number | null | undefined) => {
  const value = Number(xp ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

export const getLevelFromXp = (xp: number | null | undefined) => {
  const normalizedXp = normalizeXp(xp);
  return Math.floor(normalizedXp / XP_PER_LEVEL) + 1;
};

export const getLevelProgressXp = (xp: number | null | undefined) => {
  const normalizedXp = normalizeXp(xp);
  return normalizedXp % XP_PER_LEVEL;
};

export const getLevelProgressPercent = (xp: number | null | undefined) => {
  return (getLevelProgressXp(xp) / XP_PER_LEVEL) * 100;
};