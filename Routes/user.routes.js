import { Router } from "express";
import {logoutUser, requestRide, riderLogin, sessionCheck, updateRiderDetails,requestDriver, upcomingRides, completedRides, updatePaymentStatus, getSuggestions, getDriverLocation, updateRating } from "../controllers/user.controller.js";
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
router.route("/completedRides").get(verifyJwt,completedRides)
router.route("/updatePayment/:ride_id").post(updatePaymentStatus)
router.route("/getSuggestions").get(getSuggestions)
router.route("/getCordinates/:driverId").get(getDriverLocation)
router.route("/feedback").post(verifyJwt,updateRating)
export default router