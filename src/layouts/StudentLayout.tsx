import { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { SignOutButton } from '../../components/SignOutButton';
import { logoUrl } from '../../assets';

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md transition-colors ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-700'} hover:text-blue-700`
      }
    >
      {label}
    </NavLink>
  );
}

const navItems = [
  { to: '/student/verify', label: 'Verification' },
  { to: '/student/submit', label: 'Submit Application' },
  { to: '/student/application', label: 'My Application' },
  { to: '/student/settings', label: 'Settings' },
  { to: '/student/report', label: 'Report' },
  { to: '/student/help', label: 'Help & Support' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useLockBody(open);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center gap-3 p-3">
          <button onClick={() => setOpen(true)} className="p-2 rounded-md border border-gray-200" aria-label="Open menu">
            <div className="space-y-1">
              <span className="block h-0.5 w-5 bg-gray-700" />
              <span className="block h-0.5 w-5 bg-gray-700" />
              <span className="block h-0.5 w-5 bg-gray-700" />
            </div>
          </button>
          <img src={logoUrl} alt="Logo" className="h-7 w-auto" />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 flex-col border-r bg-white">
        <div className="h-16 flex items-center gap-3 px-4 border-b">
          <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>
        <div className="mt-auto p-6"><SignOutButton /></div>
      </aside>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed z-50 top-0 left-0 h-full w-72 bg-white border-r transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-between gap-3 px-4 border-b">
          <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
          <button className="p-2 rounded-md border border-gray-200" aria-label="Close menu" onClick={() => setOpen(false)}>
            <span className="block h-0.5 w-5 rotate-45 bg-gray-700 translate-y-[2px]" />
            <span className="block h-0.5 w-5 -rotate-45 bg-gray-700 -translate-y-[2px]" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => <NavItem key={item.to} to={item.to} label={item.label} onClick={() => setOpen(false)} />)}
        </nav>
        <div className="mt-auto p-6"><SignOutButton /></div>
      </aside>

      <main className="md:ml-64 p-4 md:p-6">{children}</main>
    </div>
  );
}
