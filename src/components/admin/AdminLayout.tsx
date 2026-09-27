import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Newspaper,
  ClipboardCheck,
  CreditCard,
  LogOut,
  ExternalLink,
  Package,
  UserSearch,
  Image as ImageIcon,
  Star,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

/**
 * Single source of truth for the admin nav — every admin page links here,
 * so adding a section means editing this array once instead of five
 * copy-pasted pill-nav blocks (that's how the old header nav drifted out
 * of sync across pages).
 */
const NAV_ITEMS = [
  { to: '/admin/articles', label: 'เนื้อหา', icon: Newspaper, match: (p: string) => p.startsWith('/admin/articles') },
  { to: '/admin/courses', label: 'หลักสูตร', icon: GraduationCap, match: (p: string) => p.startsWith('/admin/courses') },
  { to: '/admin/toolbox', label: 'Toolbox', icon: Package, match: (p: string) => p.startsWith('/admin/toolbox') },
  { to: '/admin/page-banners', label: 'Banner Explore', icon: ImageIcon, match: (p: string) => p.startsWith('/admin/page-banners') },
  { to: '/admin/assignments', label: 'งานที่ส่ง', icon: ClipboardCheck, match: (p: string) => p.startsWith('/admin/assignments') },
  { to: '/admin/onsite-scoring', label: 'ให้คะแนน Onsite', icon: Star, match: (p: string) => p.startsWith('/admin/onsite-scoring') },
  { to: '/admin/payments', label: 'การชำระเงิน', icon: CreditCard, match: (p: string) => p.startsWith('/admin/payments') },
  { to: '/admin/students', label: 'ตรวจสอบนักเรียน', icon: UserSearch, match: (p: string) => p.startsWith('/admin/students') },
];

interface AdminLayoutProps {
  /** Page title shown in the topbar, e.g. "จัดการบทความ". */
  title: string;
  /** Small uppercase eyebrow above the title, defaults to "ADMIN". */
  eyebrow?: string;
  /** Right-aligned header actions (e.g. a primary "+ new" button). */
  actions?: ReactNode;
  onSignOut: () => void;
  children: ReactNode;
}

export function AdminLayout({ title, eyebrow = 'Admin', actions, onSignOut, children }: AdminLayoutProps) {
  const { pathname } = useLocation();

  return (
    <SidebarProvider>
      <div className="admin-console-surface min-h-screen flex w-full bg-[#080808] text-white">
        <Sidebar collapsible="icon" className="border-white/8">
          <SidebarHeader className="px-3 py-4">
            <Link to="/" className="flex items-center gap-2.5 px-1 group">
              <span className="w-8 h-8 rounded-sm bg-[#D4A843] text-black font-bold text-sm flex items-center justify-center shrink-0">
                C
              </span>
              <span className="flex flex-col leading-tight overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-bold tracking-wide text-white whitespace-nowrap">CREATR365</span>
                <span className="text-[10px] text-white/35 uppercase tracking-[0.2em] whitespace-nowrap">Admin Console</span>
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/30">จัดการระบบ</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const isActive = item.match(pathname);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link to={item.to}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="px-2 pb-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="ดูหน้าเว็บไซต์">
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    <span>ดูหน้าเว็บไซต์</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onSignOut} tooltip="ออกจากระบบ">
                  <LogOut />
                  <span>ออกจากระบบ</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-[#080808]">
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/8 bg-[#080808]/95 backdrop-blur px-4 sm:px-6 h-16 shrink-0">
            <SidebarTrigger className="text-white/50 hover:text-white hover:bg-white/8" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-[0.25em] text-[#D4A843] uppercase leading-none mb-1">
                {eyebrow}
              </p>
              <h1 className="text-lg font-bold text-white truncate leading-tight">{title}</h1>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </header>

          <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default AdminLayout;
