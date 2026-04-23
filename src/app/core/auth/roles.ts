export const KC_ROLES = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  FREELANCER: 'FREELANCER'
} as const;

export type KcRole = (typeof KC_ROLES)[keyof typeof KC_ROLES];
