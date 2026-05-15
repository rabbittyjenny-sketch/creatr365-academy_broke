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
import Contact from "./pages/Contact";
import AdminCourses from "./pages/AdminCourses";
import AdminAssignments from "./pages/AdminAssignments";
import AdminPayments from "./pages/AdminPayments";
import Articles from "./pages/Articles";
import DiagnosticQuiz from "./pages/DiagnosticQuiz";
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
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/assignments" element={<AdminAssignments />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/diagnostic-quiz" element={<DiagnosticQuiz />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  </TooltipProvider>
);

export default App;
