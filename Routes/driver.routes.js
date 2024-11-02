import { Router } from "express";
import { acceptRide, cancelRide, driverLogin, getDriverRides, getRideRequests, logoutDriver, respondToRideRequest, sessionCheck, updateStatus } from "../controllers/driver.controller.js";

import { updateDriverDetails } from "../controllers/driver.controller.js";
import { verifyJwt2 } from "../Middleware/verifyjwt.js"


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
export default router