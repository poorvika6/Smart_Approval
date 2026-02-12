import { useEffect, useState } from "react";

const StaffDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});

  const staff = JSON.parse(localStorage.getItem("user"));

  /* ================= FETCH STAFF LEAVES ================= */
  useEffect(() => {
    if (!staff?._id) return;

    fetch(`http://localhost:5000/api/leave/staff/${staff._id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          console.error("Failed to load staff leaves:", data?.message || res.status);
          setLeaves([]);
          return;
        }
        setLeaves(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setLeaves([]);
      });
  }, [staff?._id]);

  /* ================= APPROVE ================= */
  const approveLeave = async (id) => {
    await fetch(`http://localhost:5000/api/leave/approve/${id}`, {
      method: "PATCH",
    });

    // remove from staff dashboard (only pending list)
    setLeaves(prev => prev.filter(l => l._id !== id));
  };

  /* ================= REJECT ================= */
  const rejectLeave = async (id) => {
    if (!rejectReasons[id]) {
      alert("Enter rejection reason");
      return;
    }

    await fetch(`http://localhost:5000/api/leave/reject/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rejectionReason: rejectReasons[id],
      }),
    });

    // remove from staff dashboard (only pending list)
    setLeaves(prev => prev.filter(l => l._id !== id));
  };

  if (!staff) return null;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">

      {/* ================= STAFF HEADER ================= */}
      <div className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center font-semibold text-lg">
            {staff.name?.charAt(0)}
          </div>

          <div>
            <p className="text-sm text-gray-400">
              {staff.facultyId?.toUpperCase()}
            </p>
            <p className="font-semibold">
              {staff.name?.toUpperCase()}
            </p>
          </div>
        </div>

        <p className="text-sm text-teal-400 font-medium">
          {staff.department}
        </p>
      </div>

      {/* ================= LEAVE REQUESTS ================= */}
      {leaves.length === 0 ? (
        <p className="text-gray-400">No pending leave requests</p>
      ) : (
        leaves.map((leave) => (
          <div
            key={leave._id}
            className="bg-gray-800 p-4 rounded-lg mb-4 shadow-md"
          >
            <h3 className="text-lg font-semibold mb-1">
              {leave.studentId?.name ?? "(Student removed)"}
            </h3>

            <p className="text-sm text-gray-400 mb-1">
              Register No: {leave.studentId?.registerNo ?? "-"}
            </p>

            <p className="mb-2">
              Attendance:{" "}
              <span className="font-semibold text-green-400">
                {leave.studentId?.attendancePercentage ?? "-"}%
              </span>
            </p>

            <p><b>Leave Type:</b> {leave.leaveType}</p>
            <p>
              <b>Date:</b>{" "}
              {leave.fromDate.slice(0, 10)} → {leave.toDate.slice(0, 10)}
            </p>
            <p>
              <b>Time:</b>{" "}
              {leave.leaveType === "sick" ? (
                leave.timeOption || "-"
              ) : (
                `${leave.fromTime || "-"} - ${leave.toTime || "-"}`
              )}
            </p>
            <p><b>Reason:</b> {leave.reason}</p>

            {/* ✅ CORRECT STATUS DISPLAY */}
            <p className="mt-2">
              <b>Status:</b>{" "}
              <span
                className={`font-semibold ${
                  leave.status === "approved"
                    ? "text-green-400"
                    : leave.status === "rejected"
                    ? "text-orange-400"
                    : "text-yellow-400"
                }`}
              >
                {leave.status.toUpperCase()}
              </span>
            </p>

            {/* ================= ACTION BUTTONS ================= */}
            {leave.status === "pending" && (
              <>
                <input
                  type="text"
                  placeholder="Rejection reason"
                  className="w-full p-2 mt-3 rounded bg-gray-700"
                  onChange={(e) =>
                    setRejectReasons({
                      ...rejectReasons,
                      [leave._id]: e.target.value,
                    })
                  }
                />

                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => approveLeave(leave._id)}
                    className="bg-green-500 px-4 py-1 rounded hover:bg-green-400"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => rejectLeave(leave._id)}
                    className="bg-orange-500 px-4 py-1 rounded hover:bg-orange-400"
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default StaffDashboard;
