import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
import AdminArticles from "./pages/AdminArticles";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import DiagnosticQuiz from "./pages/DiagnosticQuiz";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";

/* ── Auth guard: redirects to /auth?redirect=<current> if no session ── */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthed(true);
      } else {
        navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      }
      setChecked(true);
    });
  }, [navigate, location.pathname]);

  if (!checked) return null; // render nothing while checking
  return authed ? <>{children}</> : null;
}

/* ── Admin guard: requires auth + admin role ── */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth?redirect=/admin/courses', { replace: true }); setChecked(true); return; }
      const { data: roles } = await supabase
        .from('user_roles').select('role')
        .eq('user_id', session.user.id).eq('role', 'admin').maybeSingle();
      if (!roles) { navigate('/', { replace: true }); setChecked(true); return; }
      setOk(true); setChecked(true);
    })();
  }, [navigate]);

  if (!checked) return null;
  return ok ? <>{children}</> : null;
}

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <div className="site-hover-scope">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/diagnostic-quiz" element={<DiagnosticQuiz />} />
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />

        {/* Protected — requires login */}
        <Route path="/enroll/:id" element={<RequireAuth><Enroll /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />

        {/* Admin — requires login + admin role */}
        <Route path="/admin" element={<Navigate to="/admin/courses" replace />} />
        <Route path="/admin/courses" element={<RequireAdmin><AdminCourses /></RequireAdmin>} />
        <Route path="/admin/assignments" element={<RequireAdmin><AdminAssignments /></RequireAdmin>} />
        <Route path="/admin/payments" element={<RequireAdmin><AdminPayments /></RequireAdmin>} />
        <Route path="/admin/articles" element={<RequireAdmin><AdminArticles /></RequireAdmin>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  </TooltipProvider>
);

export default App;
