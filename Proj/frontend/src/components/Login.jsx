import { Link,useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useState } from "react";
import BASE_URL from "../config/api";

const Login = () => {
    const navigate = useNavigate(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

   const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("${BASE_URL}/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(`Welcome back, ${data.user.name}!`);
      localStorage.setItem(
  "user",
  JSON.stringify({
    _id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
    department: data.user.department,
    registerNo: data.user.registerNo,
    facultyId: data.user.facultyId,
    attendancePercentage: data.user.attendancePercentage,
  })
);
 // Save user info

      // Redirect based on role
      if (data.user.role === "student") navigate("/student-dashboard");
      else if (data.user.role === "staff") navigate("/staff-dashboard");
    } catch (err) {
      console.error("Login failed:", err.message);
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-black via-gray-900 to-black">
      <div className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl text-white">
        {/* Title */}
        <h2 className="text-2xl font-semibold">Welcome Back</h2>
        <p className="text-sm text-gray-400 mb-6">Sign in to continue</p>

        <form onSubmit={handleLogin}>
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
              className="w-full pl-10 pr-4 py-2 bg-[#020617] border border-gray-700 rounded-lg
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
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#020617] border border-gray-700 rounded-lg
              focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
              required
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-teal-500 text-black py-2 rounded-lg font-semibold hover:bg-teal-400 transition"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link to="/" className="text-teal-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
