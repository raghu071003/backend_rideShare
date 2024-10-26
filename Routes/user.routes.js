import { Router } from "express";
import { riderLogin, updateRiderDetails } from "../controllers/user.controller.js";






const router = Router();
router.route("/login").post(riderLogin)
router.route("/update").post(updateRiderDetails)
export default router