import { useState } from "react";
import { useEffect } from "react";
import BASE_URL from "../config/api";


const AdminAttendance = () => {
  // Attendance states
  const [registerNo, setRegisterNo] = useState("");
  const [attendance, setAttendance] = useState("");
  const [message, setMessage] = useState("");

  // General Permission states
  const [gpEnabled, setGpEnabled] = useState(false);
  const [gpForm, setGpForm] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });
  const [gpMessage, setGpMessage] = useState("");

  // Users
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [attendanceInputs, setAttendanceInputs] = useState({});

  useEffect(() => {
    fetchUsers("student");
    fetchUsers("staff");
  }, []);

  const fetchUsers = async (role) => {
    try {
      const res = await fetchWrapper(`${BASE_URL}/api/admin/users?role=${role}`);
      if (!res.ok) {
        setUserMessage(res.data.message || "Failed to load users");
        return;
      }

      if (role === "student") {
        setStudents(res.data);
        const inputs = {};
        res.data.forEach((u) => {
          inputs[u._id] = u.attendancePercentage ?? "";
        });
        setAttendanceInputs((prev) => ({ ...prev, ...inputs }));
      } else {
        setStaff(res.data);
        const inputs = {};
        res.data.forEach((u) => {
          inputs[u._id] = u.attendancePercentage ?? "";
        });
        setAttendanceInputs((prev) => ({ ...prev, ...inputs }));
      }
    } catch (err) {
      setUserMessage("Server error");
    }
  };

  const handleDelete = async (id, role) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetchWrapper(`http://localhost:5000/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setUserMessage(res.data.message || "Delete failed");
        return;
      }
      setUserMessage("User deleted");
      fetchUsers(role);
    } catch (err) {
      setUserMessage("Server error");
    }
  };

  const handleAttendanceChange = (id, value) => {
    setAttendanceInputs((prev) => ({ ...prev, [id]: value }));
  };

  const submitAttendanceForUser = async (userObj, role) => {
    const value = attendanceInputs[userObj._id];
    if (value === undefined || value === "") {
      setUserMessage("Enter attendance value");
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      setUserMessage("Attendance must be 0-100");
      return;
    }

    const body = { attendancePercentage: num };
    if (role === "student") body.registerNo = userObj.registerNo;
    else if (role === "staff") body.facultyId = userObj.facultyId;
    else body.id = userObj._id;

    try {
      const res = await fetch("http://localhost:5000/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserMessage(data.message || "Update failed");
        return;
      }

      setUserMessage(`Updated attendance for ${userObj.name}`);
      // update local list
      if (role === "student") {
        setStudents((prev) => prev.map((s) => (s._id === userObj._id ? { ...s, attendancePercentage: num } : s)));
      } else if (role === "staff") {
        setStaff((prev) => prev.map((s) => (s._id === userObj._id ? { ...s, attendancePercentage: num } : s)));
      }
    } catch (err) {
      setUserMessage("Server error");
    }
  };

  // ---------------- ATTENDANCE ----------------
  const submitAttendance = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerNo,
          attendancePercentage: Number(attendance),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message);
        return;
      }

      setMessage(
        `Updated: ${data.student.name} (${data.student.attendancePercentage}%)`
      );
      setRegisterNo("");
      setAttendance("");
    } catch {
      setMessage("Server error");
    }
  };

  // ---------------- GENERAL PERMISSION ----------------
  const submitGP = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/general-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: gpEnabled,
          ...gpForm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGpMessage(data.message);
        return;
      }

      setGpMessage("General Permission updated successfully");
    } catch {
      setGpMessage("Server error");
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white space-y-6">
      <h1 className="text-xl font-semibold">Admin Panel</h1>

      

      {/* ---------------- GENERAL PERMISSION ---------------- */}
      <div className="bg-gray-800 p-4 rounded-lg max-w-md">
        <h2 className="font-semibold mb-2">General Permission</h2>

        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={gpEnabled}
            onChange={(e) => setGpEnabled(e.target.checked)}
          />
          Enable General Permission
        </label>

        {gpEnabled && (
          <>
            <input
              type="date"
              className="w-full p-2 mb-2 rounded bg-gray-700"
              onChange={(e) =>
                setGpForm({ ...gpForm, startDate: e.target.value })
              }
            />

            <input
              type="date"
              className="w-full p-2 mb-2 rounded bg-gray-700"
              onChange={(e) =>
                setGpForm({ ...gpForm, endDate: e.target.value })
              }
            />

            <input
              type="time"
              className="w-full p-2 mb-2 rounded bg-gray-700"
              onChange={(e) =>
                setGpForm({ ...gpForm, startTime: e.target.value })
              }
            />

            <input
              type="time"
              className="w-full p-2 mb-2 rounded bg-gray-700"
              onChange={(e) =>
                setGpForm({ ...gpForm, endTime: e.target.value })
              }
            />
          </>
        )}

        <button
          onClick={submitGP}
          className="bg-teal-500 text-black px-4 py-2 rounded hover:bg-teal-400"
        >
          Save GP Settings
        </button>

        {gpMessage && <p className="mt-2 text-sm">{gpMessage}</p>}
      </div>

      {/* ---------------- USERS LIST / MANAGEMENT ---------------- */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Users (Students & Faculty)</h2>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Students</h3>
              <button
                onClick={() => fetchUsers("student")}
                className="bg-teal-500 text-black px-3 py-1 rounded"
              >
                Refresh
              </button>
            </div>
            {students && students.length === 0 && <p className="text-sm">No students</p>}
            <ul className="space-y-2 max-h-48 overflow-auto">
              {students &&
                students.map((s) => (
                  <li key={s._id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-gray-300">{s.registerNo} — {s.department}</div>
                      <div className="text-xs text-gray-300">Attendance: {s.attendancePercentage ?? "-"}%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={attendanceInputs[s._id] ?? s.attendancePercentage ?? ""}
                        onChange={(e) => handleAttendanceChange(s._id, e.target.value)}
                        className="w-20 p-1 rounded bg-gray-600 text-black"
                      />
                      <button
                        onClick={() => submitAttendanceForUser(s, "student")}
                        className="bg-teal-400 text-black px-3 py-1 rounded"
                      >
                        Set
                      </button>
                      <button
                        onClick={() => handleDelete(s._id, "student")}
                        className="bg-red-500 text-black px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Faculty</h3>
              <button
                onClick={() => fetchUsers("staff")}
                className="bg-teal-500 text-black px-3 py-1 rounded"
              >
                Refresh
              </button>
            </div>
            {staff && staff.length === 0 && <p className="text-sm">No faculty</p>}
            <ul className="space-y-2 max-h-48 overflow-auto">
              {staff &&
                staff.map((f) => (
                  <li key={f._id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                    <div>
                      <div className="text-sm font-medium">{f.name}</div>
                      <div className="text-xs text-gray-300">{f.facultyId} — {f.department}</div>
                      <div className="text-xs text-gray-300">Attendance: {f.attendancePercentage ?? "-"}%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={attendanceInputs[f._id] ?? f.attendancePercentage ?? ""}
                        onChange={(e) => handleAttendanceChange(f._id, e.target.value)}
                        className="w-20 p-1 rounded bg-gray-600 text-black"
                      />
                      <button
                        onClick={() => submitAttendanceForUser(f, "staff")}
                        className="bg-teal-400 text-black px-3 py-1 rounded"
                      >
                        Set
                      </button>
                      <button
                        onClick={() => handleDelete(f._id, "staff")}
                        className="bg-red-500 text-black px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {userMessage && <p className="text-sm">{userMessage}</p>}
      </div>
    </div>
  );
};

export default AdminAttendance;

// ----------------- helper hooks & functions -----------------
function fetchWrapper(url, options) {
  return fetch(url, options).then((r) => r.json().then((data) => ({ ok: r.ok, data })));
}
