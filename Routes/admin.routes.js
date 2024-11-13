import { Router } from "express";
import { addDriver, addRider, adminLogin, adminLogout, getAllReports, getAvailableRides, getDriverLocationHistory, getRides } from "../controllers/admin.controller.js";
import { downloadPdf } from "../utils/downloadPdf.js";
import { verifyJwt3 } from "../Middleware/verifyjwt.js";
import { downloadPdfFiltered } from "../utils/downloadPdfFiltered.js";






const router = Router();

router.route("/login").post(adminLogin)
router.route("/rides").get(getRides)
router.route("/downloadPdf").get(downloadPdf)
router.route("/download-Pdf").get(downloadPdfFiltered)
router.route("/logout").post(verifyJwt3,adminLogout)
router.route("/addRider").post(addRider)
router.route("/addDriver").post(addDriver)
router.route("/getAvailableRides").get(getAvailableRides);
router.route('/:driverId/location-history').get(verifyJwt3, getDriverLocationHistory);
router.route("/allReports").get(verifyJwt3,getAllReports)

export default router