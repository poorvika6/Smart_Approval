import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Signup user
export const signupUser = async (req, res) => {
  try {
    const { name, email, password, role, registerNo, facultyId, phone, department } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      registerNo: role === "student" ? registerNo : undefined,
      facultyId: role === "staff" ? facultyId : undefined,
      phone: role === "staff" ? phone : undefined,
      department,
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registerNo: user.registerNo,
        facultyId: user.facultyId,
        phone: user.phone,
        department: user.department,
        attendancePercentage: user.attendancePercentage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for admin credentials first
    if (email === "poorvika@gmail.com" && password === "poorvi") {
      return res.status(200).json({
        message: "Admin login successful",
        user: {
          id: "admin-001",
          name: "Admin",
          email: "poorvika@gmail.com",
          role: "admin",
          department: "Admin",
          attendancePercentage: 100,
        },
      });
    }

    // Parent login: email formatted as <registerNo>@bitsathy.ac.in
    const parentMatch = email.match(/^([A-Za-z0-9]+)@bitsathy\.ac\.in$/);
    if (parentMatch) {
      const registerNo = parentMatch[1];
      const child = await User.findOne({ registerNo, role: "student" });
      if (child) {
        return res.status(200).json({
          message: "Parent login successful",
          user: {
            id: `parent-${registerNo}`,
            name: `Parent of ${child.name}`,
            email,
            role: "parent",
            department: child.department,
            registerNo: registerNo,
            childId: child._id,
            attendancePercentage: child.attendancePercentage,
          },
        });
      }
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Success
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        registerNo: user.registerNo,
        facultyId: user.facultyId,
        department: user.department,
        attendancePercentage: user.attendancePercentage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      registerNo: user.registerNo,
      facultyId: user.facultyId,
      department: user.department,
      attendancePercentage: user.attendancePercentage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
