import { Router } from "express";
import { acceptRide, cancelRide, completeRide, driverLogin, getCurrentRides, getDriverDetails, getDriverRides, getRideRequests, logoutDriver, respondToRideRequest, sessionCheck, updateDriverLocation, updateStatus } from "../controllers/driver.controller.js";

import { updateDriverDetails } from "../controllers/driver.controller.js";
import { verifyJwt2 } from "../Middleware/verifyjwt.js"
import { sendDeatils } from "../controllers/user.controller.js";


const router = Router();

router.route("/login").post(driverLogin)
router.route("/updateRide").post(verifyJwt2,updateDriverDetails)
router.route("/getRides").post(verifyJwt2,getDriverRides)
router.route("/logout").post(verifyJwt2,logoutDriver)
router.route("/session").post(sessionCheck)
router.route("/updateRideStatus").post(verifyJwt2,updateStatus)
router.route("/acceptRide").post(verifyJwt2,acceptRide)
router.route("/cancelRide").post(verifyJwt2,cancelRide)
router.route("/respondToRide").post(verifyJwt2,respondToRideRequest)
router.route("/getRequests").get(verifyJwt2,getRideRequests)
router.route("/currentRides").get(verifyJwt2,getCurrentRides)
router.route("/completeRide").post(verifyJwt2,completeRide)
router.route("/updateDriverLocation").post(verifyJwt2,updateDriverLocation)
router.route("/myride").get(verifyJwt2,getDriverDetails)
router.route("/getUser").get(verifyJwt2,sendDeatils)
export default router