const LAB_NAME_FALLBACKS: Record<string, string> = {
  "shebin-student": "معمل عيادة طلاب شبين",
  "shebin-elkom": "معمل عيادة طلاب شبين",
};

export function getLabDisplayName(labName?: string | null, labSlug?: string | null) {
  const normalizedName = labName?.trim();
  const normalizedSlug = labSlug?.trim();
  const fallbackName = normalizedSlug ? LAB_NAME_FALLBACKS[normalizedSlug] : undefined;
  const name = normalizedName && normalizedName !== normalizedSlug ? normalizedName : fallbackName || normalizedName || normalizedSlug || "المعمل";

  return name.startsWith("معمل") ? name : `معمل ${name}`;
}
