import Leave from "../models/Leave.js";
import User from "../models/User.js";
import GeneralPermission from "../models/GeneralPermission.js";

/* =========================================================
   APPLY LEAVE (Student → Auto staff assignment)
   ========================================================= */

/* =========================
   APPLY LEAVE
========================= */
export const applyLeave = async (req, res) => {
  try {
    const { studentId, leaveType, reason, fromDate, toDate, fromTime, toTime, timeOption, status } = req.body;

    // Validate student
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // (staff assignment for non-GP leaves will be handled later)

    // ------------------ Handle General Permission ------------------
    if (leaveType === "general") {
      // Check if GP is enabled
      const gp = await GeneralPermission.findOne();
      if (!gp || !gp.enabled) {
        return res.status(400).json({ message: "General Permission is not enabled" });
      }

      // Auto-approve GP
      const leave = new Leave({
        studentId,
        leaveType,
        reason: reason || "General Permission Leave",
        status: "approved",
        fromDate: gp.startDate,
        toDate: gp.endDate,
        fromTime: gp.startTime,
        toTime: gp.endTime,
        department: student.department,
      });

      await leave.save();
      return res.status(200).json({ message: "General Permission leave applied successfully", leave });
    }

    // ------------------ Other Leave Types Validation ------------------
    if (!leaveType || !reason || !fromDate || !toDate) {
      return res.status(400).json({ message: "Missing required leave fields" });
    }

    // Enforce attendance threshold: students below 80% cannot apply unless GP is enabled
    const gp = await GeneralPermission.findOne();
    const gpEnabled = gp && gp.enabled;
    if (student.attendancePercentage < 80 && !gpEnabled) {
      return res.status(400).json({ message: "Attendance below 80% — cannot apply for leave" });
    }

    // Emergency leave: check max 12 hours
    if (leaveType === "emergency" && fromDate === toDate && fromTime && toTime) {
      let start = new Date(`${fromDate}T${fromTime}`);
      let end = new Date(`${toDate}T${toTime}`);

      if (end <= start) end.setDate(end.getDate() + 1); // overnight

      const diffHours = (end - start) / (1000 * 60 * 60);
      if (diffHours > 12) return res.status(400).json({ message: "Emergency leave cannot exceed 12 hours" });
    }

    // Enforce start-date rule: non-sick leaves must start from tomorrow
    if (leaveType !== "sick") {
      const from = new Date(fromDate);
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      tom.setHours(0, 0, 0, 0);
      from.setHours(0, 0, 0, 0);
      if (from < tom) {
        return res.status(400).json({ message: "Leave must start from tomorrow (sick leave can start today)" });
      }
    }

    // Find a staff in the same department to assign (if any)
    // Prefer a staff who has fewer than 3 pending assigned requests
    const staffCandidates = await User.find({ role: "staff", department: student.department });

    // If there are no staff at all in this department, block the application
    if (!staffCandidates || staffCandidates.length === 0) {
      return res.status(400).json({ message: "Wait for mamont — no staff assigned in your department" });
    }

    let assignedStaff = null;
    for (const staff of staffCandidates) {
      const pendingCount = await Leave.countDocuments({ staffId: staff._id, status: "pending" });
      if (pendingCount < 3) {
        assignedStaff = staff;
        break;
      }
    }

    // If no staff is available (all have 3+ pending), return informative message
    if (!assignedStaff && staffCandidates.length > 0) {
      return res.status(400).json({ message: "Staff not available at the moment" });
    }

    const leave = new Leave({
      studentId,
      leaveType,
      reason,
      fromDate,
      toDate,
      fromTime,
      toTime,
      timeOption: timeOption || undefined,
      status: "pending", // other leaves stay pending
      department: student.department,
      staffId: assignedStaff ? assignedStaff._id : undefined,
    });

    await leave.save();
    res.status(200).json({ message: "Leave applied successfully", leave });
  } catch (err) {
    console.error("APPLY LEAVE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/* =========================================================
   GET LEAVES FOR STAFF DASHBOARD
   ========================================================= */
export const getStaffLeaves = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Resolve staff user (allow param or authenticated user)
    const staffUser = await User.findById(staffId || req.user?.id);
    if (!staffUser) return res.status(404).json({ message: "Staff not found" });

    // Return leaves either specifically assigned to this staff or from their department
    // Exclude general permission leaves (they are auto-approved)
    const leaves = await Leave.find({
      $or: [
        { staffId: staffUser._id },
        { department: staffUser.department }
      ],
      leaveType: { $ne: "general" }
    })
      .populate(
        "studentId",
        "name registerNo attendancePercentage department"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* =========================================================
   APPROVE LEAVE
   ========================================================= */
export const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    leave.status = "approved";
    leave.rejectionReason = undefined;
    await leave.save();

    res.status(200).json({ message: "Leave approved successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   REJECT LEAVE
   ========================================================= */
export const rejectLeave = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res
        .status(400)
        .json({ message: "Rejection reason required" });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    leave.status = "rejected";
    leave.rejectionReason = rejectionReason;
    await leave.save();

    res.status(200).json({ message: "Leave rejected successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   GET STUDENT LEAVES
   ========================================================= */
export const getStudentLeaves = async (req, res) => {
  try {
    const { studentId } = req.params;

    const leaves = await Leave.find({ studentId })
      .populate("staffId", "name facultyId")
      .sort({ createdAt: -1 });

    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("staffId", "name facultyId");

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const updateLeaveStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;

  const leave = await Leave.findById(req.params.id);

  leave.status = status;
  leave.staffId = req.user.id;

  if (status === "rejected") {
    leave.rejectionReason = rejectionReason;
  }

  await leave.save();
  res.json(leave);
};