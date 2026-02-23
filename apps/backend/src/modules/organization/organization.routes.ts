import { Router } from "express"
import { deleteOrg, getInviteCode, getOrganization, postOrganization } from "./organization.controller"
import { getMembers, patchMember, postJoinByCode } from "./membership.controller"

const router = Router()

router.get("/organizations/:slug", getOrganization)
router.post("/organizations", postOrganization)
router.get("/organizations/:slug/invite-code", getInviteCode)
router.delete("/organizations/:slug", deleteOrg)

router.post("/organizations/join-by-code", postJoinByCode)
router.get("/organizations/:slug/members", getMembers)
router.patch("/organizations/:slug/members/:memberId", patchMember)

export default router
