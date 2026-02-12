import { useState, useEffect } from "react";
import LeaveDetailsModal from "./LeaveDetails";

const formatStatus = (status = "") =>
  status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveFormVisible, setLeaveFormVisible] = useState(false);
  const [generalPermissionEnabled, setGeneralPermissionEnabled] = useState(false);
  const [staffAvailable, setStaffAvailable] = useState(true);

  const [leaveForm, setLeaveForm] = useState({
    fromDate: "",
    toDate: "",
    fromTime: "",
    toTime: "",
    reason: "",
    leaveType: "sick",
    timeOption: "",
  });
  const [leaveError, setLeaveError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const _tomorrow = new Date();
  _tomorrow.setDate(_tomorrow.getDate() + 1);
  const tomorrowStr = _tomorrow.toISOString().split("T")[0];

  // Load user from localStorage and fetch fresh data from API
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const localUser = JSON.parse(storedUser);
      setUser(localUser);
      // Fetch fresh user data from backend to get latest attendance
      const fetchFreshUser = async (id) => {
        try {
          const res = await fetch(`http://localhost:5000/api/auth/user/${id}`);
          const data = await res.json();
          setUser(prev => ({ ...prev, ...data }));
          localStorage.setItem("user", JSON.stringify({ ...localUser, ...data }));
        } catch (err) {
          console.error("Failed to fetch fresh user data:", err);
        }
      };

      fetchFreshUser(localUser._id);

      // Check if there are any staff in the student's department
      const checkStaff = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/admin/users?role=staff`);
          const data = await res.json();
          const staffInDept = (data || []).filter(s => s.department === localUser.department);
          setStaffAvailable(staffInDept.length > 0);
        } catch (err) {
          console.error("Failed to check staff availability:", err);
          setStaffAvailable(true); // fail open
        }
      };

      checkStaff();

      // Poll user data so admin updates reflect automatically (faster)
      const poll = setInterval(() => fetchFreshUser(localUser._id), 2000);
      return () => clearInterval(poll);
    }
  }, []);

  // Fetch general permission status
  useEffect(() => {
    fetch("http://localhost:5000/api/admin/general-permission")
      .then(res => res.json())
      .then(data => setGeneralPermissionEnabled(!!data.enabled))
      .catch(err => console.error(err));
  }, []);

  // Fetch student leave requests
  const fetchStudentData = async () => {
    if (!user?._id) return;
    try {
      const resLeaves = await fetch(`http://localhost:5000/api/leave/student/${user._id}`);
      const leaves = await resLeaves.json();
      setPendingRequests(leaves.filter(l => l.status === "pending"));
      setApprovedRequests(leaves.filter(l => l.status === "approved"));
      setRejectedRequests(leaves.filter(l => l.status === "rejected"));
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const handleChange = (e) => {
    setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
  };

  // Adjust form based on leave type
  useEffect(() => {
    switch (leaveForm.leaveType) {
      case "sick":
        setLeaveForm(prev => ({ ...prev, fromDate: todayStr, toDate: todayStr, fromTime: "", toTime: "", timeOption: "", reason: "" }));
        break;
      case "emergency":
        setLeaveForm(prev => ({ ...prev, fromDate: todayStr, toDate: todayStr, fromTime: "", toTime: "", reason: "" }));
        break;
      case "special":
      case "od":
        setLeaveForm(prev => ({ ...prev, fromDate: tomorrowStr, toDate: "", fromTime: "", toTime: "", reason: "" }));
        break;
      case "general":
        setLeaveForm(prev => ({ ...prev, fromDate: "", toDate: "", fromTime: "", toTime: "", reason: "" }));
        break;
      default:
        break;
    }
  }, [leaveForm.leaveType]);

  const applyLeave = async () => {
    const { leaveType, fromDate, toDate, fromTime, toTime, reason, timeOption } = leaveForm;

    // Enforce attendance rule: cannot apply if attendance < 80 unless GP is enabled
    if (user && user.attendancePercentage < 80 && !generalPermissionEnabled) {
      return alert("Your attendance is below 80% — you cannot apply for leave unless General Permission is enabled.");
    }

    // Enforce start-date rule: non-sick leaves must start from tomorrow
    if (leaveType !== "sick") {
      const from = new Date(fromDate);
      const _tom = new Date();
      _tom.setDate(_tom.getDate() + 1);
      _tom.setHours(0,0,0,0);
      if (from < _tom) {
        setLeaveError("Leave must start from tomorrow (sick leave can start today)");
        return;
      }
    }

    // ---------- Frontend Validation ----------
    if (leaveType === "emergency") {
      if (!fromDate || !toDate || !fromTime || !toTime) return alert("All fields are required for Emergency Leave");
      if (fromDate !== toDate) return alert("Emergency leave must start and end on the same day");

      // Parse times
      const [startH, startM] = fromTime.split(":").map(Number);
      const [endH, endM] = toTime.split(":").map(Number);

      let start = new Date(fromDate);
      start.setHours(startH, startM, 0, 0);

      let end = new Date(toDate);
      end.setHours(endH, endM, 0, 0);

      // Handle overnight
      if (end <= start) end.setDate(end.getDate() + 1);

      const diffHours = (end - start) / (1000 * 60 * 60);
      if (diffHours > 12) return alert("Emergency leave cannot exceed 12 hours");
    }

    if (["special", "od"].includes(leaveType)) {
      if (!fromDate || !toDate || !fromTime || !toTime || !reason) return alert("All fields are required for Special/OD leave");
    }

    if (leaveType === "sick") {
      if (!timeOption) {
        setLeaveError("Select time option (AM/PM/Full Day) for Sick Leave");
        return;
      }
      if (!reason) {
        setLeaveError("Reason required for Sick Leave");
        return;
      }
    }

    // Prepare payload
    const payload = {
      studentId: user._id,
      leaveType,
      reason: leaveType !== "general" ? reason : "General Permission Leave",
      fromDate: leaveType !== "general" ? fromDate : undefined,
      toDate: leaveType !== "general" ? toDate : undefined,
      fromTime: ["special", "od", "emergency"].includes(leaveType) ? fromTime : undefined,
      toTime: ["special", "od", "emergency"].includes(leaveType) ? toTime : undefined,
        department: user.department, // <<< Add this
      ...(leaveType === "sick" && { timeOption }),
      ...(leaveType === "general" && { status: "approved" }), // GP auto-approved
    };

    try {
      const response = await fetch("http://localhost:5000/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) return alert(data.message);
      setLeaveError("");
      setLeaveFormVisible(false);
      setLeaveForm({ fromDate: "", toDate: "", fromTime: "", toTime: "", reason: "", leaveType: "sick", timeOption: "" });
      fetchStudentData();
      alert(data.message);
    } catch (err) {
      alert("Server error");
      console.error("APPLY LEAVE ERROR:", err);
    }
  };

  const submitGeneralPermission = async () => {
    // Submit a GP leave directly so sick-leave validation doesn't run
    const payload = {
      studentId: user._id,
      leaveType: "general",
      reason: "General Permission Leave",
      department: user.department,
    };

    try {
      const response = await fetch("http://localhost:5000/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setLeaveError(data.message || "Failed to apply general permission");
        return;
      }
      setLeaveError("");
      setLeaveFormVisible(false);
      fetchStudentData();
      alert(data.message);
    } catch (err) {
      setLeaveError("Server error");
    }
  };

  const openLeaveDetails = async (leaveId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/leave/details/${leaveId}`);
      const data = await res.json();
      setSelectedLeave(data);
    } catch (err) {
      console.error(err);
    }
  };

  const attendancePercent = Number(user?.attendancePercentage ?? 0);

  // If attendance falls below threshold while form is open, close it (unless GP enabled)
  useEffect(() => {
    if (leaveFormVisible && attendancePercent < 80 && !generalPermissionEnabled) {
      setLeaveFormVisible(false);
    }
  }, [attendancePercent, generalPermissionEnabled]);

  if (!user) return <p className="p-6 text-white">Loading...</p>;

  return (
    <>
      <div className={`p-6 bg-gray-900 min-h-screen text-white transition ${selectedLeave ? "blur-sm pointer-events-none" : ""}`}>
        {/* Header */}
        <div className="flex justify-between bg-gray-800 p-4 rounded-xl mb-6">
          <div>
            <p className="text-sm text-gray-400">{user.registerNo}</p>
            <p className="font-bold text-lg">{user.name}</p>
            <p>Attendance: <b>{user.attendancePercentage}%</b></p>
          </div>

          <div>
            <button
              disabled={(!staffAvailable && !generalPermissionEnabled) || (attendancePercent < 80 && !generalPermissionEnabled)}
              onClick={() => {
                if ((!staffAvailable && !generalPermissionEnabled) || (attendancePercent < 80 && !generalPermissionEnabled)) return;
                setLeaveFormVisible(!leaveFormVisible);
              }}
              className={`px-4 py-2 rounded-lg mt-4 font-semibold ${
                ((!staffAvailable && !generalPermissionEnabled) || (attendancePercent < 80 && !generalPermissionEnabled))
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-teal-500 text-black hover:bg-teal-400"
              }`}
            >
              Apply Leave
            </button>

            {!staffAvailable && !generalPermissionEnabled && (
              <p className="text-sm text-yellow-300 mt-2">Wait for mamont — no staff assigned in your department.</p>
            )}

            {attendancePercent < 80 && !generalPermissionEnabled && (
              <p className="text-sm text-yellow-300 mt-2">Your attendance is below 80% — you cannot apply for leave unless General Permission is enabled or your attendance is updated.</p>
            )}
          </div>
        </div>

        {/* Leave Form */}
        {(leaveFormVisible && (attendancePercent >= 80 || generalPermissionEnabled)) && (
          <div className="bg-gray-800 px-4 py-2 rounded-xl mb-6">
            <h2 className="font-semibold mb-3">Apply Leave</h2>

            {leaveError && <p className="text-sm text-red-400 mb-2">{leaveError}</p>}

            {generalPermissionEnabled && (leaveForm.leaveType === "general" || attendancePercent < 80) ? (
              <div>
                <p className="mb-3 text-sm text-gray-300">General Permission is enabled{attendancePercent < 80 ? " — other leave types are disabled while your attendance is below 80%" : ""}.</p>
                <button
                  onClick={submitGeneralPermission}
                  className="mt-1 bg-teal-500 text-black px-4 py-2 rounded hover:bg-teal-400"
                >
                  Submit General Permission
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {leaveForm.leaveType !== "general" && (
                    <input
                      type="date"
                      name="fromDate"
                      value={leaveForm.fromDate}
                      onChange={handleChange}
                      className="p-2 bg-gray-700 rounded"
                      min={leaveForm.leaveType === "sick" ? todayStr : tomorrowStr}
                    />
                  )}
                  {["special", "od", "emergency"].includes(leaveForm.leaveType) && (
                    <input
                      type="date"
                      name="toDate"
                      value={leaveForm.toDate}
                      onChange={handleChange}
                      className="p-2 bg-gray-700 rounded"
                      min={leaveForm.fromDate || (leaveForm.leaveType === "sick" ? todayStr : tomorrowStr)}
                    />
                  )}
                  {["special", "od", "emergency"].includes(leaveForm.leaveType) && (
                    <>
                      <input type="time" name="fromTime" value={leaveForm.fromTime} onChange={handleChange} className="p-2 bg-gray-700 rounded" />
                      <input type="time" name="toTime" value={leaveForm.toTime} onChange={handleChange} className="p-2 bg-gray-700 rounded" />
                    </>
                  )}
                </div>

                {leaveForm.leaveType === "sick" && (
                  <select name="timeOption" value={leaveForm.timeOption} onChange={handleChange} className="w-full mt-3 p-2 bg-gray-700 rounded">
                    <option value="">Select Time</option>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                )}

                {leaveForm.leaveType !== "general" && (
                  <textarea name="reason" placeholder="Reason" value={leaveForm.reason} onChange={handleChange} className="w-full mt-3 p-2 bg-gray-700 rounded" />
                )}

                <select name="leaveType" value={leaveForm.leaveType} onChange={handleChange} className="w-full mt-3 p-2 bg-gray-700 rounded">
                  <option value="sick">Sick</option>
                  <option value="emergency">Emergency</option>
                  <option value="special">Special</option>
                  <option value="general">General</option>
                  <option value="od">OD</option>
                </select>

                <button onClick={applyLeave} className="mt-4 bg-teal-500 text-black px-4 py-2 rounded hover:bg-teal-400">
                  Submit
                </button>
              </>
            )}
          </div>
        )}

        <LeaveSection title="Pending Requests" data={pendingRequests} color="yellow" onClick={openLeaveDetails} />
        <LeaveSection title="Approved Requests" data={approvedRequests} color="green" onClick={openLeaveDetails} />
        <LeaveSection title="Rejected Requests" data={rejectedRequests} color="orange" onClick={openLeaveDetails} />
      </div>

      {selectedLeave && <LeaveDetailsModal leave={selectedLeave} onClose={() => setSelectedLeave(null)} />}
    </>
  );
};

const LeaveSection = ({ title, data, color, onClick }) => (
  <div className="mb-5">
    <h2 className="font-semibold mb-2">{title}</h2>
    <div className="bg-gray-800 rounded p-3">
      {data.length === 0 ? <p className="text-gray-400">No records</p> :
        data.map(req => (
          <div key={req._id} onClick={() => onClick(req._id)} className="flex justify-between py-2 px-2 rounded cursor-pointer hover:bg-gray-700">
            <span>{req.reason || "(No reason)"} ({req.leaveType})</span>
            <span className={`font-semibold ${color === "green" ? "text-green-400" : color === "orange" ? "text-orange-400" : "text-yellow-400"}`}>
              {formatStatus(req.status)}
            </span>
          </div>
        ))
      }
    </div>
  </div>
);

export default StudentDashboard;
