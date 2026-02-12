import { Link ,useNavigate} from "react-router-dom";
import { User, Mail, Lock, Building2,Eye,EyeOff } from "lucide-react";
import { useState } from "react";

const Signup = () => {
      const navigate = useNavigate(); 
  // State for all input fields
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [registerNo, setRegisterNo] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

  // Handle signup submission
  
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      email,
      password,
      role,
      registerNo: role === "student" ? registerNo : undefined,
      facultyId: role === "staff" ? facultyId : undefined,
      department,
    };

    try {
      const res = await fetch("https://smart-approval.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      alert("Signup successful!");
      localStorage.setItem(
  "user",
  JSON.stringify({
    _id: data.user.id,          // 🔥 FIX
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
    department: data.user.department,
    registerNo: data.user.registerNo,
    facultyId: data.user.facultyId,
  })
);
 // Save user info

      // Redirect based on role
      if (data.user.role === "student") navigate("/student-dashboard");
      else if (data.user.role === "staff") navigate("/staff-dashboard");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-black via-gray-900 to-black">
      <div className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl text-white">
        {/* Title */}
        <h2 className="text-2xl font-semibold">Create an Account</h2>
        <p className="text-sm text-gray-400 mb-6">Sign up to get started</p>

        <form onSubmit={handleSignup}>
          {/* Name */}
          <div className="relative mb-4">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#020617] border border-gray-700 rounded-lg 
              focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
              required
            />
          </div>

          {/* Role toggle */}
          <div className="mb-4">
            <div className="flex gap-3 mb-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  role === "student"
                    ? "bg-teal-500 text-black"
                    : "border border-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                Student
              </button>

              <button
                type="button"
                onClick={() => setRole("staff")}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  role === "staff"
                    ? "bg-teal-500 text-black"
                    : "border border-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                Staff
              </button>
            </div>

            {/* Conditional input */}
            {role === "student" && (
              <input
                type="text"
                placeholder="Register Number"
                value={registerNo}
                onChange={(e) => setRegisterNo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#020617] border border-gray-700 rounded-lg 
              focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                required
              />
            )}

            {role === "staff" && (
              <input
                type="text"
                placeholder="Faculty ID"
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#020617] border border-gray-700 rounded-lg 
              focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                required
              />
            )}
          </div>

          {/* Department */}
          <div className="relative mb-4">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#020617] border border-gray-700 rounded-lg 
              focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
              required
            />
          </div>

          {/* Email */}
           <div className="relative mb-4">
        <Mail
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#020617] text-white border border-gray-700 rounded-lg
                     focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
          required
        />
      </div>

      {/* Password */}
      <div className="relative mb-6">
        <Lock
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-10 py-2 bg-[#020617] text-white border border-gray-700 rounded-lg
                     focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
          required
        />
        {/* Eye toggle button */}
        {showPassword ? (
          <EyeOff
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
            size={18}
            onClick={() => setShowPassword(false)}
          />
        ) : (
          <Eye
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
            size={18}
            onClick={() => setShowPassword(true)}
          />
        )}
      </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-black py-2 rounded-lg font-semibold hover:bg-teal-400 transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-teal-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
