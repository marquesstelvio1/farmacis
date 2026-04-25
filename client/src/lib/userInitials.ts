type UserLike = unknown;

const pickFirstString = (values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

export function getUserDisplayName(user?: UserLike): string | undefined {
  if (!user || typeof user !== "object") return undefined;
  const data = user as Record<string, unknown>;
  return pickFirstString([
    data.name,
    data.fullName,
    data.nome,
    data.username,
    data.userName,
  ]);
}

export function getUserEmail(user?: UserLike): string | undefined {
  if (!user || typeof user !== "object") return undefined;
  const data = user as Record<string, unknown>;
  return pickFirstString([
    data.email,
    data.mail,
    data.userEmail,
  ]);
}

export function getUserInitials(user?: UserLike): string {
  const displayName = getUserDisplayName(user);
  if (displayName) {
    return displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const email = getUserEmail(user);
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "US";
}
