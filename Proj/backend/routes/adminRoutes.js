import express from "express";
import {
  updateAttendance,
  enableGeneralPermission,
  getGeneralPermission,
  disableGeneralPermission,
  getStudentByRegisterNo,
   getUsersByRole,
   deleteUser,
} from "../controllers/adminController.js";

const router = express.Router();

/* =========================
   ATTENDANCE
========================= */
router.post("/attendance", updateAttendance);

/* =========================
   STUDENT FETCH (BY REGISTER NO)
========================= */
router.get("/students/register/:registerNo", getStudentByRegisterNo);

/* =========================
   LIST / DELETE USERS
   GET /api/admin/users?role=student|staff
   DELETE /api/admin/users/:id
========================= */
router.get("/users", getUsersByRole);
router.delete("/users/:id", deleteUser);

/* =========================
   GENERAL PERMISSION
========================= */
router.post("/general-permission", enableGeneralPermission);
router.get("/general-permission", getGeneralPermission);
router.post("/general-permission/disable", disableGeneralPermission);

export default router;
