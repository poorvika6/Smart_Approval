import User from "../models/User.js";
import GeneralPermission from "../models/GeneralPermission.js";

/* =========================
   UPDATE ATTENDANCE
========================= */
export const updateAttendance = async (req, res) => {
  try {
    const { registerNo, facultyId, attendancePercentage, id } = req.body;

    if (attendancePercentage === undefined) {
      return res.status(400).json({ message: "Missing attendancePercentage" });
    }

    if (attendancePercentage < 0 || attendancePercentage > 100) {
      return res.status(400).json({ message: "Invalid attendance value" });
    }

    let user = null;

    if (id) {
      user = await User.findById(id);
    } else if (registerNo) {
      user = await User.findOne({ registerNo, role: "student" });
    } else if (facultyId) {
      user = await User.findOne({ facultyId, role: "staff" });
    } else {
      return res.status(400).json({ message: "Provide registerNo, facultyId or id" });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    user.attendancePercentage = attendancePercentage;
    await user.save();

    res.status(200).json({
      message: "Attendance updated successfully",
      user: {
        name: user.name,
        id: user._id,
        role: user.role,
        registerNo: user.registerNo,
        facultyId: user.facultyId,
        attendancePercentage: user.attendancePercentage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   ENABLE / UPDATE GP
========================= */
export const enableGeneralPermission = async (req, res) => {
  const { startDate, endDate, startTime, endTime } = req.body;

  if (!startDate || !endDate || !startTime || !endTime) {
    return res.status(400).json({ message: "All GP fields required" });
  }

  let gp = await GeneralPermission.findOne();

  if (!gp) {
    gp = new GeneralPermission({
      enabled: true,
      startDate,
      endDate,
      startTime,
      endTime,
    });
  } else {
    gp.enabled = true;
    gp.startDate = startDate;
    gp.endDate = endDate;
    gp.startTime = startTime;
    gp.endTime = endTime;
  }

  await gp.save();
  res.json({ message: "General Permission Enabled", gp });
};

/* =========================
   GET GP STATUS (Student)
========================= */
export const getGeneralPermission = async (req, res) => {
  const gp = await GeneralPermission.findOne();

  if (!gp || !gp.enabled) {
    return res.json({ enabled: false });
  }

  res.json(gp);
};

/* =========================
   DISABLE GP
========================= */
export const disableGeneralPermission = async (req, res) => {
  const gp = await GeneralPermission.findOne();
  if (gp) {
    gp.enabled = false;
    await gp.save();
  }
  res.json({ message: "General Permission Disabled" });
};
// GET /api/students/register/:registerNo
// GET STUDENT BY REGISTER NUMBER
export const getStudentByRegisterNo = async (req, res) => {
  try {
    const { registerNo } = req.params;

    const student = await User.findOne({
      registerNo,
      role: "student",
    }).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET USERS BY ROLE
   Query param: ?role=student|staff
========================= */
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;

    if (!role || (role !== "student" && role !== "staff")) {
      return res.status(400).json({ message: "Invalid or missing role" });
    }

    const users = await User.find({ role }).select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   DELETE USER BY ID
   Param: :id
========================= */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


