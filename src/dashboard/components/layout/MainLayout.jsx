import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../common/UiPrimitives';
import { useHana } from '../../context/HanaContext';
import { HANA_IMAGES } from '../../assets/images';
import { ChevronUp } from 'lucide-react';
import { useLocation, Outlet } from 'react-router-dom';

export function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);
  const { toasts, dismissToast } = useHana();
  const { pathname } = useLocation();

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  // Route change hone par scroll top pe reset karo
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    setShowScrollTop(false);
  }, [pathname]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#dcecff_0%,#eaf4ff_48%,#f5f9ff_100%)] text-[#061B50] font-sans">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Global Full-Page Theme Background Image matching Sidebar Royal Blue + Gold */}
        <img
          src={HANA_IMAGES.pageBgMesh}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-[#032B91]/15" />

        <div ref={scrollRef} className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Topbar onToggleSidebar={handleToggleSidebar} />
          <main className="mx-auto w-full max-w-[1860px] flex-1 px-2 py-5 sm:px-4 lg:px-4">
            {children || <Outlet />}
          </main>
        </div>

        {/* Scroll to Top Button */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-[#FFE98A]/80 shadow-[0_6px_20px_rgba(255,184,0,0.45),0_0_0_1.5px_rgba(7,85,232,0.3)] transition-all duration-300 cursor-pointer hana-gold-btn ${
            showScrollTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <ChevronUp className="h-5 w-5 text-[#061B50]" />
        </button>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
