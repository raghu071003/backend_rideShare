import { Router } from "express";
import { logoutUser, riderLogin, sessionCheck, updateRiderDetails } from "../controllers/user.controller.js";
import {verifyJwt} from "../Middleware/verifyjwt.js";






const router = Router();
router.route("/login").post(riderLogin)
router.route("/update").post(verifyJwt,updateRiderDetails)
router.route("/logout").post(verifyJwt,logoutUser)
router.route("/session").post(verifyJwt,sessionCheck)
export default router