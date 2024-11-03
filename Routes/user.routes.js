import { Router } from "express";
import {      logoutUser, requestRide, riderLogin, sessionCheck, updateRiderDetails,requestDriver, upcomingRides } from "../controllers/user.controller.js";
import {verifyJwt} from "../Middleware/verifyjwt.js";






const router = Router();
router.route("/login").post(riderLogin)
router.route("/update").post(verifyJwt,updateRiderDetails)
router.route("/logout").post(verifyJwt,logoutUser)
router.route("/session").post(verifyJwt,sessionCheck)
// router.route("/getRides").post(verifyJwt,generateRideSuggestions)
router.route("/requestRide").post(verifyJwt,requestRide)
router.route("/requestDriver").post(verifyJwt,requestDriver)
router.route("/upcoming").get(verifyJwt,upcomingRides)
export default router