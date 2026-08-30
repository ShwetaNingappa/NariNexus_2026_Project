import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  BookOpen, 
  TrendingUp, 
  AlertOctagon, 
  ShieldCheck, 
  Settings, 
  ArrowLeft,
  Menu,
  X,
  RefreshCw,
  Award,
  HeartHandshake,
  LogOut
} from 'lucide-react';
import { useAuth } from '../services/authContext';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'AD';

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="admin-dashboard">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-primary-gold/15 bg-white transition-transform transform md:translate-x-0 md:static md:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-primary-gold/10">
          <Link to="/" className="flex items-center space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-deep-rose to-primary-pink text-xs font-bold text-white shadow-sm">
              <HeartHandshake className="h-4 w-4 text-white" />
            </span>
            <span className="font-serif text-base font-extrabold tracking-wider text-[#2D241A] ml-1">NariNexus</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1 md:hidden text-[#7D7061] hover:text-[#2D241A] transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1.5" aria-label="Sidebar Navigation">
          <Link to="/" className="flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-deep-rose transition border border-transparent">
            <ArrowLeft className="h-4 w-4" />
            <span>Platform Home</span>
          </Link>
          <div className="my-3 border-t border-primary-gold/10" />
          <span className="px-4 text-[9px] uppercase tracking-widest font-extrabold text-deep-gold">Administration</span>
          <button className="w-full flex items-center space-x-3 rounded-xl bg-soft-yellow/80 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#4A3E31] text-left border border-primary-gold/20 shadow-sm">
            <Users className="h-4.5 w-4.5 text-deep-gold" />
            <span>Users Admin</span>
          </button>
          <button className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent">
            <Building2 className="h-4.5 w-4.5 text-deep-rose" />
            <span>Validate Centres</span>
          </button>
          <button className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent">
            <BookOpen className="h-4.5 w-4.5 text-deep-gold" />
            <span>Courses Catalog</span>
          </button>
          <button className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent">
            <TrendingUp className="h-4.5 w-4.5 text-[#6B8E6F]" />
            <span>Global Analytics</span>
          </button>
          <button className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent">
            <AlertOctagon className="h-4.5 w-4.5 text-deep-rose" />
            <span>System Reports</span>
          </button>
          <div className="my-3 border-t border-primary-gold/10" />
          <button 
            onClick={logout} 
            className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-deep-rose hover:bg-soft-rose/20 transition text-left border border-transparent cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-primary-gold/10 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 md:hidden text-[#7D7061] hover:bg-cream rounded-xl">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Global Platform Administration</h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-deep-rose to-primary-pink flex items-center justify-center font-bold text-white border border-soft-rose/30 text-sm shadow-sm">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2D241A]">{user?.name || 'System Administrator'}</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-[#6B8E6F]">Root Access</span>
            </div>
          </div>
        </header>

        {/* Panel View */}
        <main className="p-6 space-y-6">
          
          {/* Welcome / Quick Controls */}
          <section className="rounded-2xl bg-white border border-primary-gold/15 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full bg-soft-yellow text-deep-gold text-[9px] font-extrabold uppercase tracking-wider border border-primary-gold/20">SYSTEM OPERATIONS</span>
              <h2 className="font-serif text-2xl font-extrabold text-[#2D241A]">Operations Control Center</h2>
              <p className="text-xs text-[#7D7061] font-semibold">Supervise center approval files, monitor gamification multipliers, and compile activity charts.</p>
            </div>
          </section>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-4 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">TOTAL USERS</span>
              <span className="text-2xl font-extrabold text-[#2D241A] mt-1.5 block">1,250</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">PENDING CENTRES</span>
              <span className="text-2xl font-extrabold text-deep-gold mt-1.5 block">12 Hubs</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">TOTAL COURSES</span>
              <span className="text-2xl font-extrabold text-[#6B8E6F] mt-1.5 block">24 Modules</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">REPORTED TOPICS</span>
              <span className="text-2xl font-extrabold text-[#7D7061] mt-1.5 block">0 items</span>
            </div>
          </div>

          {/* Operational lists */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Center Approvals */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col md:col-span-2">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#6B8E6F]">APPROVAL ROSTER</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3">Pending Coaching Centres</h3>
              
              <div className="mt-4 space-y-4 flex-grow text-xs">
                {/* Centre 1 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-cream/40 border border-primary-gold/10 rounded-xl gap-4 hover:bg-cream/70 transition">
                  <div className="space-y-1">
                    <span className="font-bold text-[#2D241A] block text-sm">Savithri Women Welfare Trust</span>
                    <span className="text-[10px] text-[#7D7061] block font-semibold">Dharmapuri, TN | Applied 2 hours ago</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 rounded-full bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition border border-transparent cursor-pointer">Approve</button>
                    <button className="px-4 py-2 rounded-full bg-white border border-primary-gold/20 text-[#7D7061] text-[10px] font-bold uppercase tracking-wider hover:bg-cream transition cursor-pointer">Review</button>
                  </div>
                </div>

                {/* Centre 2 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-cream/40 border border-primary-gold/10 rounded-xl gap-4 hover:bg-cream/70 transition">
                  <div className="space-y-1">
                    <span className="font-bold text-[#2D241A] block text-sm">Prerana Digital Hub for Rural Women</span>
                    <span className="text-[10px] text-[#7D7061] block font-semibold">Chitradurga, KA | Applied 1 day ago</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 rounded-full bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition border border-transparent cursor-pointer">Approve</button>
                    <button className="px-4 py-2 rounded-full bg-white border border-primary-gold/20 text-[#7D7061] text-[10px] font-bold uppercase tracking-wider hover:bg-cream transition cursor-pointer">Review</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Checklist */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-deep-gold">CHECKS &amp; GATEWAYS</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3">Global Settings</h3>
              
              <div className="mt-4 space-y-4 flex-grow text-xs text-[#7D7061]">
                <div className="p-4 bg-soft-yellow/50 rounded-xl border border-primary-gold/20 flex items-start space-x-3">
                  <ShieldCheck className="h-5 w-5 text-deep-gold shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-[#2D241A] block uppercase text-[10px] tracking-widest">Security Rules Enforced</span>
                    <span className="text-[11px] block leading-relaxed font-semibold">Pydantic input filters &amp; connection timeouts validated at application boundary.</span>
                  </div>
                </div>

                <div className="p-4 bg-cream/40 border border-primary-gold/10 rounded-xl space-y-2">
                  <span className="font-bold text-[#2D241A] block uppercase text-[10px] tracking-widest text-deep-gold">System State logs</span>
                  <p className="text-xs leading-relaxed font-semibold">
                    Database schemas configured in `/schemas` folder stand ready for MongoDB Atlas replication. No active breaches.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
