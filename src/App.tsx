import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Toolbox from "./pages/Toolbox";
import AiLab from "./pages/AiLab";
import CreatorTools from "./pages/CreatorTools";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Enroll from "./pages/Enroll";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";
import FAQ from "./pages/FAQ";
import AdminCourses from "./pages/AdminCourses";
import AdminAssignments from "./pages/AdminAssignments";
import AdminOnsiteScoring from "./pages/AdminOnsiteScoring";
import AdminPayments from "./pages/AdminPayments";
import AdminArticles from "./pages/AdminArticles";
import AdminToolbox from "./pages/AdminToolbox";
import AdminPageBanners from "./pages/AdminPageBanners";
import AdminStudents from "./pages/AdminStudents";
import { RequireAdmin } from "./components/admin/RequireAdmin";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import DiagnosticQuiz from "./pages/DiagnosticQuiz";
import Discover from "./pages/Discover";
import MyEvents from "./pages/MyEvents";
import { EventDetailPage } from "./components/EventDetailPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <div className="site-hover-scope">
      <CookieConsentBanner />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/toolbox" element={<Toolbox />} />
        <Route path="/ai-lab" element={<AiLab />} />
        <Route path="/creator-tools" element={<CreatorTools />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/enroll/:id" element={<Enroll />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/faq" element={<FAQ />} />
        {/* Event CMS was a single-event-only editor (blank whenever there
            were 0 events, and it could only edit whichever event happened
            to load first) — fully superseded by the unified content admin
            below, which has real event CRUD. Redirected rather than left
            rendering a confusing blank page. */}
        <Route path="/admin" element={<Navigate to="/admin/articles" replace />} />
        <Route path="/admin/courses" element={<RequireAdmin><AdminCourses /></RequireAdmin>} />
        <Route path="/admin/assignments" element={<RequireAdmin><AdminAssignments /></RequireAdmin>} />
        <Route path="/admin/onsite-scoring" element={<RequireAdmin><AdminOnsiteScoring /></RequireAdmin>} />
        <Route path="/admin/payments" element={<RequireAdmin><AdminPayments /></RequireAdmin>} />
        <Route path="/admin/articles" element={<RequireAdmin><AdminArticles /></RequireAdmin>} />
        <Route path="/admin/toolbox" element={<RequireAdmin><AdminToolbox /></RequireAdmin>} />
        <Route path="/admin/page-banners" element={<RequireAdmin><AdminPageBanners /></RequireAdmin>} />
        <Route path="/admin/students" element={<RequireAdmin><AdminStudents /></RequireAdmin>} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/diagnostic-quiz" element={<DiagnosticQuiz />} />
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/events" element={<Discover />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/my-events" element={<MyEvents />} />
        {/* Events are official workshops, created only in the admin content
            page. These old template routes let any logged-in user publish
            straight onto /events; they now land on the admin page, whose
            guard sends non-admins home. */}
        <Route path="/create-event" element={<Navigate to="/admin/articles" replace />} />
        <Route path="/edit-event/:id" element={<Navigate to="/admin/articles" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  </TooltipProvider>
);

export default App;
