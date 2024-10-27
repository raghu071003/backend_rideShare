import { Router } from "express";
import { driverLogin, getDriverRides, logoutDriver, sessionCheck } from "../controllers/driver.controller.js";

import { updateDriverDetails } from "../controllers/driver.controller.js";
import { verifyJwt2 } from "../Middleware/verifyjwt.js"


const router = Router();

router.route("/login").post(driverLogin)
router.route("/updateRide").post(verifyJwt2,updateDriverDetails)
router.route("/getRides").post(verifyJwt2,getDriverRides)
router.route("/logout").post(verifyJwt2,logoutDriver)
router.route("/session").post(sessionCheck)
export default router