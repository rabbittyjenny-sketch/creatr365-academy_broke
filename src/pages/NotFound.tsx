import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from '@/components/SEOHead';
import { CourseNavbar } from '@/components/CourseNavbar';
import { Footer } from '@/components/Footer';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEOHead
        title="ไม่พบหน้าที่ค้นหา — CREATR365"
        description="ไม่พบหน้าที่คุณต้องการ กรุณากลับสู่หน้าแรก"
      />
      <CourseNavbar />
      <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-16">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold" data-accent="red">404</h1>
          <p className="mb-6 text-lg text-muted-foreground">ขออภัยค่ะ ไม่พบหน้าที่คุณต้องการ</p>
          <Link to="/" className="inline-flex items-center gap-1.5 nav-link text-foreground" data-accent="red">
            <ArrowLeft className="w-4 h-4" /> กลับหน้าแรก
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
