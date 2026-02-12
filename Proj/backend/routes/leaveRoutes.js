import express from "express";
import {
  applyLeave,
  getStaffLeaves,
  approveLeave,
  rejectLeave,
  getStudentLeaves,
  getLeaveById,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

const router = express.Router();

router.post("/apply", applyLeave);
router.get("/staff/:staffId", getStaffLeaves);
router.patch("/approve/:id", approveLeave);
router.patch("/reject/:id", rejectLeave);
router.get("/student/:studentId", getStudentLeaves);
router.get("/details/:id", getLeaveById);
router.put("/:id/status", updateLeaveStatus);


export default router;
