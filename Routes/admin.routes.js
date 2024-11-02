import { Router } from "express";
import { addDriver, addRider, adminLogin, adminLogout, getAvailableRides, getRides } from "../controllers/admin.controller.js";
import { downloadPdf } from "../utils/downloadPdf.js";
import { verifyJwt3 } from "../Middleware/verifyjwt.js";






const router = Router();

router.route("/login").post(adminLogin)
router.route("/rides").get(getRides)
router.route("/downloadPdf").get(downloadPdf)
router.route("/logout").post(verifyJwt3,adminLogout)
router.route("/addRider").post(addRider)
router.route("/addDriver").post(addDriver)
router.route("/getAvailableRides").get(getAvailableRides);
export default router