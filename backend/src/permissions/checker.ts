import { User } from "@prisma/client"
import { Action, Permission, Resource, Role } from "./types"
import { roles } from "./roles"

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PermissionDeniedError"
  }
}

export function hasPermission(
  user: User,
  action: Action,
  resource: Resource,
  data?: any
): boolean {
  const permission: Permission = `${action}:${resource}`
  
  // If user has no roles, deny access
  if (!user.roles || user.roles.length === 0) return false

  // Check each role the user has
  return user.roles.some((role: Role) => {
    const rolePermission = roles[role][permission]
    
    // If the permission is not defined for this role, deny access
    if (rolePermission === undefined) return false
    
    // If the permission is a boolean, return it
    if (typeof rolePermission === "boolean") return rolePermission
    
    // If the permission is a function, evaluate it with the provided data
    return rolePermission(user, data)
  })
}

export function checkPermission(
  user: User,
  action: Action,
  resource: Resource,
  data?: any
): void {
  if (!hasPermission(user, action, resource, data)) {
    throw new PermissionDeniedError(
      `User does not have permission to ${action} ${resource}`
    )
  }
} 