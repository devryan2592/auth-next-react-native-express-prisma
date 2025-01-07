import { RoleConfig } from "./types"
import { User } from "@prisma/client"

export const roles: RoleConfig = {
  ADMIN: {
    "create:users": true,
    "read:users": true,
    "update:users": true,
    "delete:users": true,
    "create:posts": true,
    "read:posts": true,
    "update:posts": true,
    "delete:posts": true,
    "create:comments": true,
    "read:comments": true,
    "update:comments": true,
    "delete:comments": true,
    "create:profiles": true,
    "read:profiles": true,
    "update:profiles": true,
    "delete:profiles": true,
  },
  USER: {
    "read:users": true,
    "update:users": (user: User, targetUser: User) => user.id === targetUser.id,
    "create:posts": true,
    "read:posts": true,
    "update:posts": (user: User, post: any) => post.authorId === user.id && !post.locked,
    "delete:posts": (user: User, post: any) => post.authorId === user.id && !post.locked,
    "create:comments": true,
    "read:comments": true,
    "update:comments": (user: User, comment: any) => comment.authorId === user.id,
    "delete:comments": (user: User, comment: any) => comment.authorId === user.id,
    "read:profiles": true,
    "update:profiles": (user: User, profile: any) => profile.userId === user.id,
  },
} 