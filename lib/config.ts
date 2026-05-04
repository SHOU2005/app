export const ADMIN_PHONE = process.env.ADMIN_PHONE || '9205617375'
export const VALID_ROLES = ['WORKER', 'EMPLOYER', 'CAPTAIN', 'OPS', 'ADMIN'] as const
export type AppRole = typeof VALID_ROLES[number]

export function isValidRole(r: unknown): r is AppRole {
  return typeof r === 'string' && (VALID_ROLES as readonly string[]).includes(r)
}
