import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
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
        {/* Javna landing stranica — početna tačka za nove posjetioce */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/book/:employeeId" element={<BookAppointment />} />

        {/* Zaštićene rute unutar Layout sidebar-a */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/services" element={<Services />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/working-hours" element={<WorkingHours />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/create-tenant" element={<CreateTenant />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
