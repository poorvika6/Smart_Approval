import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    department: {
      type: String,
      
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date },
    fromTime: { type: String }, // for emergency & special/od
    toTime: { type: String },   // for emergency & special/od
    timeOption: {               // for sick leave
      type: String,
      enum: ["AM", "PM", "Full Day"],
    },
    reason: { type: String },
    leaveType: {
      type: String,
      enum: ["sick", "emergency", "special", "general", "od"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Leave", leaveSchema);
