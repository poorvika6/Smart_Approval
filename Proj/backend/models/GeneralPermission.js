import mongoose from "mongoose";

const generalPermissionSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    startDate: Date,
    endDate: Date,
    startTime: String,
    endTime: String,
  },
  { timestamps: true }
);

export default mongoose.model("GeneralPermission", generalPermissionSchema);
