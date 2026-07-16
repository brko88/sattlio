import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTenant } from "./contexts/TenantContext";

import { isReservedPath } from "./reservedPaths";

import OwnerLayout from "./layouts/OwnerLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";

import ComingSoon from "./pages/ComingSoon";
import GlobalAnnouncementBanner from "./components/GlobalAnnouncementBanner";
import NetworkStatusBanner from "./components/NetworkStatusBanner";
import UpdateBanner from "./components/UpdateBanner";

// Lazy-loaded stranice - svaka postaje svoj JS chunk, ucitava se tek kad
// korisnik stvarno ode na tu rutu (Dok. checklist: "Lazy loading - ne
// ucitavati sve stranice odjednom").
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const BookingLanding = lazy(() => import("./pages/BookingLanding"));
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const SalonProfile = lazy(() => import("./pages/SalonProfile"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const Services = lazy(() => import("./pages/Services"));
const Customers = lazy(() => import("./pages/Customers"));
const Appointments = lazy(() => import("./pages/Appointments"));
const WorkingHours = lazy(() => import("./pages/WorkingHours"));
const Calendar = lazy(() => import("./pages/Calendar"));
const CreateTenant = lazy(() => import("./pages/CreateTenant"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Users = lazy(() => import("./pages/Users"));
const DashboardAdmin = lazy(() => import("./pages/DashboardAdmin"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const AdminAnnouncements = lazy(() => import("./pages/AdminAnnouncements"));


function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400 text-sm">Učitavanje...</p>
    </div>
  );
}

function PublicOrApp() {
  const location = useLocation();
  if (!isReservedPath(location.pathname)) {
    return (
      <Routes>
        <Route path=":slug" element={<SalonProfile />} />
        <Route path="*" element={<RoleRouter />} />
      </Routes>
    );
  }

  return <RoleRouter />;
}

function RoleRouter() {
  const { tenants, isLoading, fetchError, refreshTenants } = useTenant();

  const token = localStorage.getItem("access_token");
  const isSuperadmin = localStorage.getItem("is_superadmin") === "true";
  const currentRole = localStorage.getItem("current_role") ?? "";

  // 1. Nema tokena — login
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

  // 2b. Greska pri ucitavanju (npr. prekid neta) - NE tumaciti kao "korisnik
  // nema salona", nego ponuditi ponovni pokusaj dok se ne potvrdi stvarno stanje.
  if (fetchError && tenants.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-slate-700 font-medium mb-2">Greška pri učitavanju</p>
          <p className="text-slate-500 text-sm mb-4">
            Provjerite internet konekciju. Stranica će se sama osvježiti kad se veza vrati, ili pokušajte ručno.
          </p>
          <button
            onClick={() => refreshTenants()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Pokušaj ponovo
          </button>
        </div>
      </div>
    );
  }

  // 3. Superadmin
  if (isSuperadmin) {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/admin/tenants" element={<AdminPanel />} />
          <Route path="/admin/users" element={<Users />} />
          <Route
            path="/admin/verifications"
            element={
              <AdminPanel
                fixedStatusFilter="pending,suspended"
                title="Verifikacije"
                description="Saloni koji čekaju verifikaciju ili su suspendovani."
              />
            }
          />
          <Route path="/admin/subscriptions" element={<ComingSoon title="Pretplate" />} />
          <Route path="/admin/statistics" element={<Analytics />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/audit-log" element={<ComingSoon title="Audit log" />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/admin/tenants" replace />} />
        </Route>
      </Routes>
    );
  }

  // 4. Korisnik nema nijedan tenant — onboarding
  if (tenants.length === 0) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/create-tenant" element={<CreateTenant />} />
        <Route path="/book" element={<BookingLanding />} />
        <Route path="/book/:employeeId" element={<BookAppointment />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
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
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/report-issue" element={<ReportIssue />} />
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
          <Route path="/working-hours" element={<WorkingHours />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/report-issue" element={<ReportIssue />} />
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/report-issue" element={<ReportIssue />} />
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
      <UpdateBanner />
      <NetworkStatusBanner />
      <GlobalAnnouncementBanner />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/uslovi-koristenja" element={<TermsOfService />} />
          <Route path="/politika-privatnosti" element={<PrivacyPolicy />} />
          <Route path="/book/:employeeId" element={<BookAppointment />} />

          <Route path="/*" element={<PublicOrApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
