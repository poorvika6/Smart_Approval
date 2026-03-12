import Leave from "../models/Leave.js";
import User from "../models/User.js";
import GeneralPermission from "../models/GeneralPermission.js";

/* =========================================================
   HELPER FUNCTION: Check for overlapping leaves
   ========================================================= */
const checkLeaveOverlap = (newLeave, existingLeave) => {
  const { leaveType: newType, fromDate: newFrom, toDate: newTo, timeOption: newTimeOpt } = newLeave;
  const { leaveType: existType, fromDate: existFrom, toDate: existTo, timeOption: existTimeOpt } = existingLeave;

  // Convert dates to comparable format (YYYY-MM-DD)
  const newFromStr = new Date(newFrom).toISOString().split("T")[0];
  const newToStr = new Date(newTo).toISOString().split("T")[0];
  const existFromStr = new Date(existFrom).toISOString().split("T")[0];
  const existToStr = new Date(existTo).toISOString().split("T")[0];

  // For sick leaves, check if on same date and overlapping times
  if (newType === "sick" && existType === "sick" && newFromStr === existFromStr) {
    const timeRanges = {
      "AM": { start: 8.5, end: 12.5 }, // 8:30 to 12:30
      "PM": { start: 11.5, end: 16.5 }, // 11:30 to 4:30
      "Full Day": { start: 0, end: 24 }
    };

    const newRange = timeRanges[newTimeOpt] || timeRanges["Full Day"];
    const existRange = timeRanges[existTimeOpt] || timeRanges["Full Day"];

    // Check for overlap
    if (newRange.start < existRange.end && newRange.end > existRange.start) {
      return true; // Overlap exists
    }
  }

  // For multi-day leaves and other types, check date overlap
  if (newType !== "sick" || existType !== "sick") {
    const newFromDate = new Date(newFromStr);
    const newToDate = new Date(newToStr);
    const existFromDate = new Date(existFromStr);
    const existToDate = new Date(existToStr);

    // Check if date ranges overlap
    if (newFromDate <= existToDate && newToDate >= existFromDate) {
      return true; // Overlap exists
    }
  }

  return false; // No overlap
};

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

    // Check for overlapping leaves (pending, approved, or rejected)
    const existingLeaves = await Leave.find({ studentId });
    const newLeaveData = { leaveType, fromDate, toDate, timeOption };
    
    for (const existLeave of existingLeaves) {
      if (checkLeaveOverlap(newLeaveData, {
        leaveType: existLeave.leaveType,
        fromDate: existLeave.fromDate,
        toDate: existLeave.toDate,
        timeOption: existLeave.timeOption
      })) {
        return res.status(400).json({ message: "You already have a leave application that overlaps with this period" });
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

    // Return only leaves that are assigned to this staff member
    // Exclude general permission leaves (they are auto-approved)
    const leaves = await Leave.find({
      staffId: staffUser._id,
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
      .populate("staffId", "name facultyId phone")
      .sort({ createdAt: -1 });

    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   PARENT DASHBOARD & ACTIONS
   ========================================================= */
export const getParentDashboard = async (req, res) => {
  try {
    const { registerNo } = req.params;
    const student = await User.findOne({ registerNo, role: "student" }).select("name registerNo attendancePercentage department");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const leaves = await Leave.find({ studentId: student._id })
      .populate("staffId", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({ student, leaves });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const parentApproveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Only pending leaves can be approved" });
    }
    leave.status = "approved";
    await leave.save();
    res.status(200).json({ message: "Leave approved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const parentRejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Only pending leaves can be rejected" });
    }
    leave.status = "rejected";
    await leave.save();
    res.status(200).json({ message: "Leave rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("staffId", "name facultyId phone");

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
   EDIT LEAVE (only for pending status)
   ========================================================= */
export const editLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveType, reason, fromDate, toDate, fromTime, toTime, timeOption } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // Only allow editing if status is pending
    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Cannot edit an approved or rejected leave" });
    }

    // Validate student
    const student = await User.findById(leave.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check attendance for non-GP leaves
    const gp = await GeneralPermission.findOne();
    const gpEnabled = gp && gp.enabled;
    if (student.attendancePercentage < 80 && !gpEnabled && leaveType !== "general") {
      return res.status(400).json({ message: "Attendance below 80% — cannot edit leave" });
    }

    // Validate start-date rule: non-sick leaves must start from tomorrow
    if (leaveType !== "sick" && leaveType !== "general") {
      const from = new Date(fromDate);
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      tom.setHours(0, 0, 0, 0);
      from.setHours(0, 0, 0, 0);
      if (from < tom) {
        return res.status(400).json({ message: "Leave must start from tomorrow (sick leave can start today)" });
      }
    }

    // Emergency leave: check max 12 hours
    if (leaveType === "emergency" && fromDate === toDate && fromTime && toTime) {
      let start = new Date(`${fromDate}T${fromTime}`);
      let end = new Date(`${toDate}T${toTime}`);

      if (end <= start) end.setDate(end.getDate() + 1);

      const diffHours = (end - start) / (1000 * 60 * 60);
      if (diffHours > 12) {
        return res.status(400).json({ message: "Emergency leave cannot exceed 12 hours" });
      }
    }

    // Check for overlapping leaves (excluding the current leave being edited)
    const existingLeaves = await Leave.find({ studentId: leave.studentId, _id: { $ne: id } });
    const updatedLeaveData = { leaveType, fromDate, toDate, timeOption };
    
    for (const existLeave of existingLeaves) {
      if (checkLeaveOverlap(updatedLeaveData, {
        leaveType: existLeave.leaveType,
        fromDate: existLeave.fromDate,
        toDate: existLeave.toDate,
        timeOption: existLeave.timeOption
      })) {
        return res.status(400).json({ message: "You already have a leave application that overlaps with this period" });
      }
    }

    // Update leave fields
    leave.leaveType = leaveType;
    leave.reason = reason;
    leave.fromDate = fromDate;
    leave.toDate = toDate;
    leave.fromTime = fromTime;
    leave.toTime = toTime;
    leave.timeOption = timeOption;

    await leave.save();
    res.status(200).json({ message: "Leave updated successfully", leave });
  } catch (err) {
    console.error("EDIT LEAVE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   DELETE LEAVE (only for pending status)
   ========================================================= */
export const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // Only allow deleting if status is pending
    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Cannot delete an approved or rejected leave" });
    }

    await Leave.findByIdAndDelete(id);
    res.status(200).json({ message: "Leave deleted successfully" });
  } catch (err) {
    console.error("DELETE LEAVE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateLeaveStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;

  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ message: "Leave not found" });

  leave.status = status;
  // do not overwrite the original assigned staffId - keep whoever was assigned at application time
  // if it was unset (shouldn't normally happen) we could optionally set it once
  if (!leave.staffId) {
    leave.staffId = req.user.id;
  }

  if (status === "rejected") {
    leave.rejectionReason = rejectionReason;
  } else {
    // clear rejection reason when approving or resetting
    leave.rejectionReason = undefined;
  }

  await leave.save();
  res.json(leave);
};