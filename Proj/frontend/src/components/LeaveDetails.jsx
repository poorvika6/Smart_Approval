const LeaveDetails = ({ leave, onClose }) => {
  const statusColor =
    leave.status === "approved"
      ? "bg-green-600"
      : leave.status === "rejected"
      ? "bg-orange-500"
      : "bg-yellow-500 text-black";

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      
      {/* Modal */}
      <div className="bg-gray-900 text-white w-225 max-h-[90vh] rounded-xl shadow-xl relative">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">
            Leave Details - {leave.leaveType.toUpperCase()}
          </h2>

          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white cursor-pointer
              hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[75vh]">

          {/* Leave Information */}
          <h3 className="font-semibold mb-4 text-gray-200">
            Leave Information
          </h3>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">

            <Info label="Leave Type" value={leave.leaveType.toUpperCase()} />

            <Info
              label="From Date"
              value={new Date(leave.fromDate).toLocaleString()}
            />

            <Info
              label="To Date"
              value={new Date(leave.toDate).toLocaleString()}
            />

            <Info label="Gate Out" value={leave.fromTime} />
            <Info label="Gate In" value={leave.toTime} />

            <Info
              label="Duration"
              value={`${Math.ceil(
                (new Date(leave.toDate) - new Date(leave.fromDate)) /
                  (1000 * 60 * 60 * 24)
              )} days`}
            />

            <Info label="Status">
              <span className={`px-3 py-1 rounded-full text-white ${statusColor}`}>
                {leave.status.toUpperCase()}
              </span>
            </Info>
          </div>

          {/* Remarks */}
          <div className="mt-5">
            <p className="font-semibold text-sm mb-1 text-gray-300">
              Remarks
            </p>
            <p className="text-sm text-gray-400">
              {leave.reason}
            </p>
          </div>

          {/* Approval Status */}
          <h3 className="font-semibold mt-6 mb-3 text-gray-200">
            Approval Status
          </h3>

          {/* Faculty */}
          {leave.staffId && (
            <ApprovalCard
              title="Faculty"
              name={leave.staffId.name}
              status={leave.status}
            />
          )}

          {/* Rejection Reason */}
          {leave.status === "rejected" && (
            <div className="mt-4 bg-orange-900 bg-opacity-30 border border-orange-500 p-3 rounded">
              <p className="font-semibold text-orange-400 text-sm">
                Rejection Reason
              </p>
              <p className="text-sm text-gray-300">
                {leave.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Helper Components ---------- */

const Info = ({ label, value, children }) => (
  <div>
    <p className="text-gray-400 mb-1">{label}</p>
    {value && <p className="font-medium text-gray-200">{value}</p>}
    {children}
  </div>
);

const ApprovalCard = ({ title, name, status }) => (
  <div className="border border-gray-700 rounded-lg p-4 flex justify-between items-center mb-3 bg-gray-800">
    <div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-gray-400">{name}</p>
      <p className="text-sm text-gray-500">
        Approved by: {name}
      </p>
    </div>

    <span
      className={`px-3 py-1 rounded-full text-white ${
        status === "approved"
          ? "bg-green-600"
          : status === "rejected"
          ? "bg-orange-500"
          : "bg-yellow-500 text-black"
      }`}
    >
      {status.toUpperCase()}
    </span>
  </div>
);
export default LeaveDetails;