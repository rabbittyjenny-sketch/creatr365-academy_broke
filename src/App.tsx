import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Enroll from "./pages/Enroll";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import AdminCourses from "./pages/AdminCourses";
import AdminAssignments from "./pages/AdminAssignments";
import AdminPayments from "./pages/AdminPayments";
import AdminArticles from "./pages/AdminArticles";
import Admin from "./pages/Admin";
import { RequireAdmin } from "./components/admin/RequireAdmin";
import Articles from "./pages/Articles";
import DiagnosticQuiz from "./pages/DiagnosticQuiz";
import Discover from "./pages/Discover";
import MyEvents from "./pages/MyEvents";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import { EventDetailPage } from "./components/EventDetailPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <div className="site-hover-scope">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/enroll/:id" element={<Enroll />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="/admin/courses" element={<RequireAdmin><AdminCourses /></RequireAdmin>} />
        <Route path="/admin/assignments" element={<RequireAdmin><AdminAssignments /></RequireAdmin>} />
        <Route path="/admin/payments" element={<RequireAdmin><AdminPayments /></RequireAdmin>} />
        <Route path="/admin/articles" element={<RequireAdmin><AdminArticles /></RequireAdmin>} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/diagnostic-quiz" element={<DiagnosticQuiz />} />
        <Route path="/events" element={<Discover />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/my-events" element={<MyEvents />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/edit-event/:id" element={<EditEvent />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  </TooltipProvider>
);

export default App;
