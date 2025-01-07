import { NextFunction, Request, Response } from "express"
import { Action, Resource } from "../permissions/types"
import { checkPermission } from "../permissions/checker"
import { User } from "@prisma/client"

interface AuthenticatedRequest extends Request {
  user: User
}

export const requirePermission = (action: Action, resource: Resource) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        })
      }

      // Get the resource data if it exists in the request
      const resourceData = req.params.id
        ? { id: req.params.id, ...req.body }
        : undefined

      // Check if the user has the required permission
      checkPermission(user, action, resource, resourceData)

      next()
    } catch (error) {
      if (error.name === "PermissionDeniedError") {
        return res.status(403).json({
          status: "error",
          message: error.message,
        })
      }
      next(error)
    }
  }
}

// Usage example:
// router.put("/users/:id", requirePermission("update", "users"), updateUserController) 