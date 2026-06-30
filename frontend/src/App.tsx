import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BookAppointment from "./pages/BookAppointment";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Services from "./pages/Services";
import Customers from "./pages/Customers";
import Appointments from "./pages/Appointments";
import WorkingHours from "./pages/WorkingHours";
import Calendar from "./pages/Calendar";
import CreateTenant from "./pages/CreateTenant";
import AdminPanel from "./pages/AdminPanel";
import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/book/:employeeId" element={<BookAppointment />} />

        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="services" element={<Services />} />
          <Route path="customers" element={<Customers />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="working-hours" element={<WorkingHours />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="create-tenant" element={<CreateTenant />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
