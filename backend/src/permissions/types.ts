import { Role as PrismaRole, User } from "@prisma/client"

export type Resource = "users" | "posts" | "comments" | "profiles"
export type Action = "create" | "read" | "update" | "delete"
export type Permission = `${Action}:${Resource}`

export type Role = PrismaRole

export type PermissionCheck = boolean | ((user: User, resource?: any) => boolean)

export type RolePermissions = {
  [P in Permission]?: PermissionCheck
}

export type RoleConfig = {
  [R in Role]: RolePermissions
}

// Type to extract specific resource permissions
export type ResourcePermissions<R extends Resource> = {
  [A in Action]?: PermissionCheck
} 