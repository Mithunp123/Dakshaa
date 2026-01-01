import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AOS from "aos";
import "aos/dist/aos.css";
import { Toaster } from 'react-hot-toast';
import "./App.css";
import ParticlesComponent from "./Pages/Layout/ParticlesComponent";
import Navbar from "./Pages/Layout/Navbar";
import Tags from "./Pages/Layout/Tags";
import UltraFooter from "./Pages/Layout/UltraFooter";
import LoadingScreen from "./Pages/Layout/LoadingScreen";
import ScrollToTop from "./Pages/Layout/ScrollToTop";
import FloatingCallButton from "./Pages/Layout/FloatingCallButton";
import FloatingDashboardButton from "./Pages/Layout/FloatingDashboardButton";
import BottomNavbar from "./Pages/Layout/BottomNavbar";
import SupabaseHealthCheck from "./components/SupabaseHealthCheck";

// Lazy Load Pages
const Home = lazy(() => import("./Pages/Home/Home"));
const Events = lazy(() => import("./Pages/Events/Events"));
const GuestLecture = lazy(() => import("./Pages/GuestLecture/GuestLecture"));
const Workshop = lazy(() => import("./Pages/Workshop/Workshop"));
const Sponsors = lazy(() => import("./Pages/Sponsors/Sponsors"));
const Contact = lazy(() => import("./Pages/Home/Components/Contact"));
const Harmonics = lazy(() => import("./Pages/Harmonics/Harmonics"));
const EventDetails = lazy(() => import("./Pages/Events/EventDetails/EventDetails"));
const Teams = lazy(() => import("./Pages/Teams/Teams"));
const Startup = lazy(() => import("./Pages/Startup/Startup"));
const Accomodation = lazy(() => import("./Pages/Accomodation/Accomodation"));
const Hackathon = lazy(() => import("./Pages/Hackathon/Hackathon"));
const Codathon = lazy(() => import("./Pages/Codathon/Codathon"));
const Register = lazy(() => import("./Pages/Register/Register"));
const EventRegistration = lazy(() => import("./Pages/Register/EventRegistration"));
const Dashboard = lazy(() => import("./Pages/Dashboard/Dashboard"));
const Schedule = lazy(() => import("./Pages/Schedule/Schedule"));
const Feedback = lazy(() => import("./Pages/Feedback/Feedback"));
const Scan = lazy(() => import("./Pages/Scan/Scan"));
const Login = lazy(() => import("./Pages/Login/Login"));
const Leaderboard = lazy(() => import("./Pages/Leaderboard/Leaderboard"));
const LiveStatusBoard = lazy(() => import("./Pages/LiveStatus/LiveStatusBoard"));
const LiveStats = lazy(() => import("./Pages/LiveStatus/LiveStats"));
const TestConnection = lazy(() => import("./Pages/TestConnection"));
const MyRegistrations = lazy(() => import("./Pages/MyRegistrations/MyRegistrations"));
const AdminDashboard = lazy(() => import("./Pages/Admin/AdminDashboard"));
const PaymentSimulation = lazy(() => import("./Pages/Register/Components/PaymentSimulation"));

// Components that are always needed can remain static or also be lazy loaded if large
import AuthRedirect from "./Components/AuthRedirect";
import ProtectedRoute from "./Components/ProtectedRoute";

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
const RegistrationAdminDashboard = lazy(() => import("./Pages/Admin/RegAdmin/RegistrationAdminDashboard"));
const EventCoordinatorDashboard = lazy(() => import("./Pages/Admin/Coordinator/EventCoordinatorDashboard"));
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
  const isRegisterEvents = location.pathname === "/register-events";

  // Check if bottom navbar should be shown (mobile only, non-admin pages)
  const showBottomNav = !isDashboard && !isAdmin && !isScan && !isLogin;

  return (
    <div className={`min-h-screen min-h-screen-safe ${showBottomNav ? 'pb-16 md:pb-0' : ''}`}>
      {!isDashboard && !isAdmin && !isScan && !isLogin && <Navbar />}
      {!isDashboard && !isAdmin && !isScan && !isLogin && <Tags />}
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingScreen variant="cyber" text="Loading..." />}>
          <Routes>
            <Route
              path="/"
              element={
                <AuthRedirect>
                  <Home />
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
            <Route path="/events" element={<Events />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/events/conference" element={<GuestLecture />} />
            <Route path="/events/workshop" element={<Workshop />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/events/hormonics" element={<Harmonics />} />
            <Route path="/event/:eventId" element={<EventDetails />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/startups" element={<Startup />} />
            <Route path="/accomodation" element={<Accomodation />} />
            <Route path="/event/hackathon" element={<Hackathon />} />
            <Route path="/event/codeathon" element={<Codathon />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/register-events" element={<EventRegistration />} />
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
                  allowedRoles={["super_admin", "registration_admin"]}
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
            </Route>

            {/* Coordinator Routes */}
            <Route
              path="/coordinator"
              element={
                <ProtectedRoute
                  allowedRoles={["event_coordinator", "super_admin"]}
                >
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<EventCoordinatorDashboard />} />
              <Route path="scanner" element={<AttendanceScanner />} />
            </Route>

            {/* Volunteer Routes */}
            <Route
              path="/volunteer"
              element={
                <ProtectedRoute allowedRoles={["volunteer", "super_admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<VolunteerDashboard />} />
              <Route path="scanner" element={<AttendanceScanner />} />
            </Route>
          </Routes>
        </Suspense>
      </AnimatePresence>

      {!isDashboard && !isAdmin && !isScan && !isLogin && <UltraFooter />}
      {!isAdmin && !isRegisterEvents && <FloatingDashboardButton />}
      {!isDashboard && !isAdmin && !isScan && !isLogin && !isRegisterEvents && (
        <FloatingCallButton />
      )}
      {showBottomNav && <BottomNavbar />}
      <ScrollToTop />
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AOS.init({
      duration: 1000, // Animation duration
      once: true, // Whether animation should happen only once
    });

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

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
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingScreen variant="cyber" text="Initializing..." />
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <SupabaseHealthCheck>
          <Router>
            <ParticlesComponent id="particlesBG" />
            <AppContent />
          </Router>
        </SupabaseHealthCheck>
      )}
    </>
  );
}

export default App;
