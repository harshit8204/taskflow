import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'All Tasks' },
  { to: '/team', icon: Users, label: 'Team' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  const Sidebar = () => (
    <aside className="h-full flex flex-col">
      <div className="px-6 py-5 border-b border-[#1e2535] flex items-center gap-2">
        <div className="w-8 h-8 bg-[#0ea5e9] rounded-lg flex items-center justify-center"><Zap size={16} className="text-white" /></div>
        <span className="font-display font-bold text-lg text-white">TaskFlow</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[#0ea5e9]/15 text-[#0ea5e9] border border-[#0ea5e9]/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2030]'}`}>
            <Icon size={17} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-[#1e2535]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a2030] mb-2">
          <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/20 border border-[#0ea5e9]/30 flex items-center justify-center text-[#0ea5e9] font-semibold text-sm">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p><p className="text-xs text-slate-500">{user?.role}</p></div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><LogOut size={16} />Sign out</button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      <div className="hidden lg:flex flex-col w-64 bg-[#161b27] border-r border-[#1e2535] flex-shrink-0"><Sidebar /></div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-64 bg-[#161b27] border-r border-[#1e2535]"><Sidebar /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1e2535] bg-[#161b27]">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-[#1a2030] text-slate-400"><Menu size={20} /></button>
          <span className="font-display font-bold text-white">TaskFlow</span>
        </div>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}