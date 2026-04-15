import type { UserRole, Permission } from '@caseconnect/types';
import { ROLE_PERMISSIONS } from '@caseconnect/types';

export function getUserPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getUserPermissions(role);
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const userPermissions = getUserPermissions(role);
  return permissions.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const userPermissions = getUserPermissions(role);
  return permissions.every((p) => userPermissions.includes(p));
}
