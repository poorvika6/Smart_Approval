import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },
    registerNo: {
      type: String,
      required: function () {
        return this.role === "student";
      },
    },
    facultyId: {
      type: String,
      required: function () {
        return this.role === "staff";
      },
    },
    department: {
      type: String,
      required: true,
    },
    attendancePercentage: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
},
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
