import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StudentDashboard from "./components/StudentDashboard";
import StaffDashboard from "./components/StaffDashboard";
import AdminAttendance from "./components/AdminAttendance";
import LeaveDetails from "./components/LeaveDetails";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signup/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/student-dashboard" element={<StudentDashboard/>} />
        <Route path="/staff-dashboard" element={<StaffDashboard/>} />
         <Route path="/admin-dashboard" element={<AdminAttendance/>} />
         <Route path="/student/leave/:id" element={<LeaveDetails />} />

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;