import { Router } from "express"
import userRouter from "../modules/user/user.routes"
import orgRouter from "../modules/organization/organization.routes"

const router = Router()

router.use(userRouter)
router.use(orgRouter)

export default router
