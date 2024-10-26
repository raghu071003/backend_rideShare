import { Router } from "express";
import { logoutUser, riderLogin, updateRiderDetails } from "../controllers/user.controller.js";
import verifyJwt from "../Middleware/verifyjwt.js";






const router = Router();
router.route("/login").post(riderLogin)
router.route("/update").post(updateRiderDetails)
router.route("/logout").post(verifyJwt,logoutUser)
export default router