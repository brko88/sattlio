import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTenant } from "./contexts/TenantContext";

import MyAppointments from "./pages/MyAppointments";
import BookingLanding from "./pages/BookingLanding";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import BookAppointment from "./pages/BookAppointment";

import OwnerLayout from "./layouts/OwnerLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Services from "./pages/Services";
import Customers from "./pages/Customers";
import Appointments from "./pages/Appointments";
import WorkingHours from "./pages/WorkingHours";
import Calendar from "./pages/Calendar";
import CreateTenant from "./pages/CreateTenant";
import AdminPanel from "./pages/AdminPanel";

function RoleRouter() {
  const { currentRole, tenants, isLoading } = useTenant();

  // 1. Nema tokena — login
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Čekamo učitavanje
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Učitavanje...</p>
      </div>
    );
  }

  // 3. Superadmin — UVIJEK PRVO
  const isSuperadmin = localStorage.getItem("is_superadmin") === "true";
  if (isSuperadmin) {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/admin/tenants" replace />} />
        </Route>
      </Routes>
    );
  }

  // 4. Nema tenanta — kreiraj
  if (tenants.length === 0) {
    return (
      <Routes>
        <Route path="/create-tenant" element={<CreateTenant />} />
        <Route path="*" element={<Navigate to="/create-tenant" replace />} />
      </Routes>
    );
  }

  // 5. Owner
  if (currentRole === "owner") {
    return (
      <Routes>
        <Route element={<OwnerLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/services" element={<Services />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/working-hours" element={<WorkingHours />} />
          <Route path="/create-tenant" element={<CreateTenant />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    );
  }

  // 6. Employee
  if (currentRole === "employee") {
    return (
      <Routes>
        <Route element={<EmployeeLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    );
  }

  // 7. Customer
  if (currentRole === "customer") {
    return (
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/book" element={<BookingLanding />} />
          <Route path="/book/:employeeId" element={<BookAppointment />} />
          <Route path="*" element={<Navigate to="/my-appointments" replace />} />
        </Route>
      </Routes>
    );
  }

  // 8. Fallback
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/book/:employeeId" element={<BookAppointment />} />

        {/* Sve zaštićene rute kroz RoleRouter */}
        <Route path="/*" element={<RoleRouter />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
