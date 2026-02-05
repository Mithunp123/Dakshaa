import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, lazy, Suspense, memo } from "react";
import { Toaster } from 'react-hot-toast';
import "./App.css";

// Layout components - kept as static imports since they're always needed
import Navbar from "./Pages/Layout/Navbar";
import Tags from "./Pages/Layout/Tags";
import LoadingScreen from "./Pages/Layout/LoadingScreen";
import ScrollToTop from "./Pages/Layout/ScrollToTop";
import BottomNavbar from "./Pages/Layout/BottomNavbar";
import { AuthProvider } from "./Components/AuthProvider";

// Lazy load non-critical layout components
const UltraFooter = lazy(() => import("./Pages/Layout/UltraFooter"));
const FloatingCallButton = lazy(() => import("./Pages/Layout/FloatingCallButton"));
const FloatingDashboardButton = lazy(() => import("./Pages/Layout/FloatingDashboardButton"));
const SupabaseHealthCheck = lazy(() => import("./Components/SupabaseHealthCheck"));

// Lazy Load Pages with preload functions for faster navigation
const Home = lazy(() => import("./Pages/Home/Home"));
const Events = lazy(() => import("./Pages/Events/Events"));
const Conference = lazy(() => import("./Pages/Conference/Conference"));
const Workshop = lazy(() => import("./Pages/Workshop/Workshop"));
const Sponsors = lazy(() => import("./Pages/Sponsors/Sponsors"));
const Contact = lazy(() => import("./Pages/Home/Components/Contact"));
const Harmonics = lazy(() => import("./Pages/Harmonics/Harmonics"));
const EventDetails = lazy(() => import("./Pages/Events/EventDetails/EventDetails"));
const Teams = lazy(() => import("./Pages/Teams/Teams"));
const Startup = lazy(() => import("./Pages/Startup/Startup"));
const Accomodation = lazy(() => import("./Pages/Accomodation/Accomodation.jsx"));
const Hackathon = lazy(() => import("./Pages/Hackathon/Hackathon.jsx"));
const Codathon = lazy(() => import("./Pages/Codathon/Codathon.jsx"));
const Register = lazy(() => import("./Pages/Register/Register.jsx"));
const EventRegistration = lazy(() => import("./Pages/Register/EventRegistration.jsx"));
const Dashboard = lazy(() => import("./Pages/Dashboard/Dashboard.jsx"));
const Schedule = lazy(() => import("./Pages/Schedule/Schedule"));
const Referral = lazy(() => import("./Pages/Referral/Referral"));
const Feedback = lazy(() => import("./Pages/Feedback/Feedback"));
const Scan = lazy(() => import("./Pages/Scan/Scan"));
const Login = lazy(() => import("./Pages/Login/Login"));
const ForgotPassword = lazy(() => import("./Pages/ForgotPassword/ForgotPassword"));
const Leaderboard = lazy(() => import("./Pages/Leaderboard/Leaderboard"));
const LiveStatusBoard = lazy(() => import("./Pages/LiveStatus/LiveStatusBoard"));
const LiveStats = lazy(() => import("./Pages/LiveStatus/LiveStats"));
const TestConnection = lazy(() => import("./Pages/TestConnection"));
const MyRegistrations = lazy(() => import("./Pages/MyRegistrations/MyRegistrations"));
const AdminDashboard = lazy(() => import("./Pages/Admin/AdminDashboard"));
const PaymentSimulation = lazy(() => import("./Pages/Register/Components/PaymentSimulation"));
const TermsAndConditions = lazy(() => import("./Pages/TermsAndConditions/TermsAndConditions"));
const NotFound = lazy(() => import("./Pages/NotFound"));

// Preload functions for critical pages - call these on hover
// Note: This is exported as a plain object (not a component) to be used in Navbar
export const preloadPages = {
  home: () => import("./Pages/Home/Home"),
  events: () => import("./Pages/Events/Events"),
  schedule: () => import("./Pages/Schedule/Schedule"),
  referral: () => import("./Pages/Referral/Referral"),
  sponsors: () => import("./Pages/Sponsors/Sponsors"),
  teams: () => import("./Pages/Teams/Teams"),
  contact: () => import("./Pages/Home/Components/Contact"),
  login: () => import("./Pages/Login/Login"),
  register: () => import("./Pages/Register/Register"),
  registerEvents: () => import("./Pages/Register/EventRegistration"),
  dashboard: () => import("./Pages/Dashboard/Dashboard"),
};

// Components that are always needed can remain static or also be lazy loaded if large
import AuthRedirect from "./Components/AuthRedirect";
import ProtectedRoute from "./Components/ProtectedRoute";
import SessionMonitor from "./Components/SessionMonitor";

// Admin & Staff Imports (Lazy Loaded)
const AdminLayout = lazy(() => import("./Pages/Admin/AdminLayout"));
const SuperAdminOverview = lazy(() => import("./Pages/Admin/SuperAdmin/Overview"));
const UserManager = lazy(() => import("./Pages/Admin/SuperAdmin/UserManager"));
const EventConfig = lazy(() => import("./Pages/Admin/SuperAdmin/EventConfig"));
const EventConfiguration = lazy(() => import("./Pages/Admin/SuperAdmin/EventConfiguration"));
const ComboManagement = lazy(() => import("./Pages/Admin/SuperAdmin/ComboManagement"));
const FinanceManager = lazy(() => import("./Pages/Admin/SuperAdmin/FinanceManager"));
const RegistrationManagement = lazy(() => import("./Pages/Admin/SuperAdmin/RegistrationManagement"));
const FinanceModule = lazy(() => import("./Pages/Admin/SuperAdmin/FinanceModule"));
const ParticipantCRM = lazy(() => import("./Pages/Admin/SuperAdmin/ParticipantCRM"));
const WaitlistManagement = lazy(() => import("./Pages/Admin/SuperAdmin/WaitlistManagement"));
const EventRegistrationManager = lazy(() => import("./Pages/Admin/SuperAdmin/EventRegistrationManager"));
const AccommodationManager = lazy(() => import("./Pages/Admin/SuperAdmin/AccommodationManager"));
const EventController = lazy(() => import("./Pages/Admin/SuperAdmin/EventController"));
const RoleManagement = lazy(() => import("./Pages/Admin/SuperAdmin/RoleManagement"));
const ReferralManager = lazy(() => import("./Pages/Admin/SuperAdmin/ReferralManager"));
const PendingRegistrations = lazy(() => import("./Pages/Admin/SuperAdmin/PendingRegistrations"));
const AttendanceManagement = lazy(() => import("./Pages/Admin/SuperAdmin/AttendanceManagement"));
const RegistrationAdminDashboard = lazy(() => import("./Pages/Admin/RegAdmin/RegistrationAdminDashboard"));
const EventCoordinatorDashboard = lazy(() => import("./Pages/Admin/Coordinator/EventCoordinatorDashboard"));
const CoordinatorOverviewPage = lazy(() => import("./Pages/Admin/Coordinator/OverviewPage"));
const CoordinatorRegistrationPage = lazy(() => import("./Pages/Admin/Coordinator/RegistrationPage"));
const CoordinatorAttendancePage = lazy(() => import("./Pages/Admin/Coordinator/AttendancePage"));
const CoordinatorGlobalScanner = lazy(() => import("./Pages/Admin/Coordinator/GlobalScannerPage"));
const AttendanceScanner = lazy(() => import("./Pages/Admin/Volunteer/AttendanceScanner"));
const VolunteerDashboard = lazy(() => import("./Pages/Admin/Volunteer/VolunteerDashboard"));

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/coordinator") ||
    location.pathname.startsWith("/volunteer");
  const isScan = location.pathname === "/scan";
  const isLogin = location.pathname === "/login";
  const isForgotPassword = location.pathname === "/forgot-password";
  const isRegisterEvents = location.pathname === "/register-events";
  const isHome = location.pathname === "/";
  const isLiveStats = location.pathname === "/live-stats";

  // Check if bottom navbar should be shown (mobile only, non-admin pages)
  const showBottomNav = !isDashboard && !isAdmin && !isScan && !isLogin && !isForgotPassword;

  // Prefetch critical pages after initial load for faster navigation
  useEffect(() => {
    // Start prefetching earlier when browser is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadPages.events?.();
        preloadPages.schedule?.();
        preloadPages.dashboard?.();
        preloadPages.registerEvents?.();
      }, { timeout: 1000 });
    } else {
      const prefetchTimer = setTimeout(() => {
        preloadPages.events?.();
        preloadPages.schedule?.();
        preloadPages.dashboard?.();
        preloadPages.registerEvents?.();
      }, 1000); // Reduced from 2s to 1s
      return () => clearTimeout(prefetchTimer);
    }
  }, []);

  return (
    <div className="min-h-screen min-h-screen-safe" style={{ minHeight: '100vh', position: 'relative' }}>
      <SessionMonitor />
      {!isDashboard && !isAdmin && !isScan && !isLogin && !isForgotPassword && <Navbar />}
      {!isDashboard && !isAdmin && !isScan && !isLogin && !isForgotPassword && <Tags />}
      <Suspense key={location.key} fallback={<LoadingScreen variant="pulse" text="Loading..." />}>
        <Routes location={location} key={location.key}>
          <Route
            path="/"
            element={
              <AuthRedirect>
                <Home key={location.key} />
              </AuthRedirect>
              }
            />
            <Route
              path="/home"
              element={
                <AuthRedirect>
                  <Home key={location.key} />
                </AuthRedirect>
              }
            />
            <Route
              path="/login"
              element={
                <AuthRedirect>
                  <Login />
                </AuthRedirect>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AuthRedirect>
                  <ForgotPassword />
                </AuthRedirect>
              }
            />
            <Route path="/events" element={<Events />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/events/conference" element={<Conference />} />
            <Route path="/events/hackathon" element={<Hackathon />} />
            <Route path="/events/workshop" element={<Workshop />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/events/hormonics" element={<Harmonics />} />
            <Route path="/event/hackathon-1" element={<Hackathon />} />
            <Route path="/event/hackathon-2" element={<Hackathon />} />
            <Route path="/event/hackathon-3" element={<Hackathon />} />
            <Route path="/event/hackathon-4" element={<Hackathon />} />
            <Route path="/event/hackathon-5" element={<Hackathon />} />
            <Route path="/event/hackathon-6" element={<Hackathon />} />
            <Route path="/event/hackathon" element={<Hackathon />} />
            <Route path="/event/:eventId" element={<EventDetails />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/startups" element={<Startup />} />
            <Route path="/accomodation" element={<Accomodation />} />
            <Route path="/event/codeathon" element={<Codathon />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/signup" element={<Register />} />
            <Route 
              path="/register-events" 
              element={
                <ProtectedRoute allowedRoles={["student", "super_admin", "registration_admin", "event_coordinator", "volunteer"]}>
                  <EventRegistration />
                </ProtectedRoute>
              } 
            />
            <Route path="/scan" element={<Scan />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute allowedRoles={["student", "super_admin", "registration_admin", "event_coordinator", "volunteer"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/live-status" element={<LiveStatusBoard />} />
            <Route path="/live-stats" element={<LiveStats />} />
            <Route path="/test-connection" element={<TestConnection />} />
            <Route path="/my-registrations" element={<MyRegistrations />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/payment-simulation" element={<PaymentSimulation />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  allowedRoles={["super_admin", "registration_admin", "event_coordinator"]}
                >
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <SuperAdminOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="roles"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <RoleManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <UserManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="events"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <EventConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="event-configuration"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <EventConfiguration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="combos"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <ComboManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <FinanceManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="registrations"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <RegistrationManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance-module"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <FinanceModule />
                  </ProtectedRoute>
                }
              />
              <Route
                path="crm"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <ParticipantCRM />
                  </ProtectedRoute>
                }
              />
              <Route
                path="waitlist"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <WaitlistManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="accommodation"
                element={
                  <ProtectedRoute
                    allowedRoles={["super_admin", "registration_admin"]}
                  >
                    <AccommodationManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="referrals"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <ReferralManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="pending-registrations"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <PendingRegistrations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <AttendanceManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="event-controller"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "coordinator"]}>
                    <EventController />
                  </ProtectedRoute>
                }
              />
              <Route
                path="event/:eventId/manage"
                element={
                  <ProtectedRoute allowedRoles={["super_admin", "coordinator"]}>
                    <EventRegistrationManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="desk"
                element={
                  <ProtectedRoute
                    allowedRoles={["registration_admin", "super_admin"]}
                  >
                    <RegistrationAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator"
                element={
                  <ProtectedRoute
                    allowedRoles={["event_coordinator", "super_admin"]}
                  >
                    <EventCoordinatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator/overview"
                element={
                  <ProtectedRoute
                    allowedRoles={["event_coordinator", "super_admin"]}
                  >
                    <CoordinatorOverviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator/registration"
                element={
                  <ProtectedRoute
                    allowedRoles={["event_coordinator", "super_admin"]}
                  >
                    <CoordinatorRegistrationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator/attendance"
                element={
                  <ProtectedRoute
                    allowedRoles={["event_coordinator", "super_admin"]}
                  >
                    <CoordinatorAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="coordinator/global-scanner"
                element={
                  <ProtectedRoute
                    allowedRoles={["event_coordinator", "super_admin"]}
                  >
                    <CoordinatorGlobalScanner />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Legacy standalone coordinator route - redirect to admin/coordinator */}
            <Route
              path="/coordinator"
              element={
                <ProtectedRoute
                  allowedRoles={["event_coordinator", "super_admin"]}
                >
                  <EventCoordinatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coordinator/scanner"
              element={
                <ProtectedRoute
                  allowedRoles={["event_coordinator", "super_admin"]}
                >
                  <AttendanceScanner />
                </ProtectedRoute>
              }
            />

            {/* Volunteer Routes */}
            <Route
              path="/volunteer"
              element={
                <ProtectedRoute allowedRoles={["volunteer", "super_admin", "event_coordinator"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CoordinatorGlobalScanner />} />
              <Route path="scanner" element={<AttendanceScanner />} />
              <Route path="gate" element={<VolunteerDashboard />} />
            </Route>

            {/* 404 Route - Must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>

      {!isDashboard && !isAdmin && !isScan && !isLogin && !isForgotPassword && (
        <Suspense fallback={null}>
          <UltraFooter />
        </Suspense>
      )}
      {!isAdmin && !isRegisterEvents && !isLiveStats && (
        <Suspense fallback={null}>
          <FloatingDashboardButton />
        </Suspense>
      )}
      {!isDashboard && !isAdmin && !isScan && !isLogin && !isForgotPassword && !isRegisterEvents && !isLiveStats && (
        <Suspense fallback={null}>
          <FloatingCallButton />
        </Suspense>
      )}
      {showBottomNav && <BottomNavbar />}
      <ScrollToTop />
    </div>
  );
}

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            zIndex: 99999,
          },
        }}
      />
      <Suspense fallback={null}>
        <SupabaseHealthCheck>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </SupabaseHealthCheck>
      </Suspense>
    </>
  );
}

export default App;
