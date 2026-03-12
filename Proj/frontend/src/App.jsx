import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import StudentDashboard from "./components/StudentDashboard";
import StaffDashboard from "./components/StaffDashboard";
import AdminAttendance from "./components/AdminAttendance";
import LeaveDetails from "./components/LeaveDetails";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-4">Please refresh the page or contact support if the problem persists.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-teal-500 text-black px-4 py-2 rounded hover:bg-teal-400"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signup/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/student-dashboard" element={
          <ErrorBoundary>
            <StudentDashboard/>
          </ErrorBoundary>
        } />
        <Route path="/staff-dashboard" element={<StaffDashboard/>} />
         <Route path="/admin-dashboard" element={<AdminAttendance/>} />
         <Route path="/student/leave/:id" element={<LeaveDetails />} />

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;