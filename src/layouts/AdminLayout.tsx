import { useEffect, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { SignOutButton } from '../../components/SignOutButton';
import { logoUrl } from '../../assets';

function NavItem({ to, label, onClick, end }: { to: string; label: string; onClick?: () => void; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
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
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/applications', label: 'Applications' },
  { to: '/admin/judges', label: 'Judges' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/analytics', label: 'Analytics' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <div className="min-h-screen bg-gray-50">
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
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 flex-col border-r bg-white">
        <div className="h-16 flex items-center gap-3 px-4 border-b">
          <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>
        <div className="mt-auto p-6"><SignOutButton /></div>
      </aside>
      <div className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setOpen(false)} />
      <aside className={`md:hidden fixed z-50 top-0 left-0 h-full w-72 bg-white border-r transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between gap-3 px-4 border-b">
          <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
          <button className="p-2 rounded-md border border-gray-200" aria-label="Close menu" onClick={() => setOpen(false)}>×</button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} end={item.end} onClick={() => setOpen(false)} />
          ))}
        </nav>
        <div className="mt-auto p-6"><SignOutButton /></div>
      </aside>
      <main className="md:ml-64 p-4 md:p-6">{children}</main>
    </div>
  );
}
