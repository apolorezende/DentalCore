import { Router } from "express"
import { getMe, getMyOrganizations } from "./user.controller"

const router = Router()

router.get("/me", getMe)
router.get("/me/organizations", getMyOrganizations)

export default router
