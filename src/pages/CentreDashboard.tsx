import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Calendar, 
  GraduationCap, 
  CheckSquare, 
  PlusCircle, 
  Settings, 
  ArrowLeft,
  Menu,
  X,
  FileCheck,
  HeartHandshake,
  LogOut
} from 'lucide-react';
import { useAuth } from '../services/authContext';

export default function CentreDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'KC';

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="centre-dashboard">
      {/* Sidebar for Desktop */}
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
          <span className="px-4 text-[9px] uppercase tracking-widest font-extrabold text-[#C8870A]">Coaching Hub</span>
          <button className="w-full flex items-center space-x-3 rounded-xl bg-soft-yellow/80 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#4A3E31] text-left border border-primary-gold/20 shadow-sm">
            <Building2 className="h-4.5 w-4.5 text-deep-gold" />
            <span>Center Profile</span>
          </button>
          <button className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent">
            <GraduationCap className="h-4.5 w-4.5 text-deep-rose" />
            <span>Manage Courses</span>
          </button>
          <button className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent">
            <Calendar className="h-4.5 w-4.5 text-deep-gold" />
            <span>Active Batches</span>
          </button>
          <button className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent">
            <CheckSquare className="h-4.5 w-4.5 text-[#6B8E6F]" />
            <span>Attendance Registers</span>
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

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-y-auto">
        
        {/* Topbar */}
        <header className="h-16 border-b border-primary-gold/10 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 md:hidden text-[#7D7061] hover:bg-cream rounded-xl">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Coaching Centre Management</h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-deep-gold to-primary-gold flex items-center justify-center font-bold text-white border border-primary-gold/30 text-sm shadow-sm">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2D241A]">{user?.name || 'Kiran Mahila Kendra'}</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-deep-rose">Regd. Center #104</span>
            </div>
          </div>
        </header>

        {/* Panels */}
        <main className="p-6 space-y-6">
          
          {/* Welcome section */}
          <section className="rounded-2xl bg-white border border-primary-gold/15 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2">
              <span className="inline-block px-3.5 py-1 rounded-full bg-sage-green text-green-800 text-[9px] font-extrabold uppercase tracking-wider border border-green-200/50">VERIFIED PROVIDER</span>
              <h2 className="font-serif text-2xl font-extrabold text-[#2D241A]">{user?.name || 'Kiran Mahila Kendra'} Portal</h2>
              <p className="text-xs text-[#7D7061] font-semibold">Review and moderate active batches, verify rosters, and post practical scorecharts.</p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button className="inline-flex items-center justify-center w-full md:w-auto rounded-full bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose text-xs font-bold uppercase tracking-widest text-white px-6 py-3.5 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Batch
              </button>
            </div>
          </section>

          {/* Quick numbers */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-4 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">ACTIVE COURSES</span>
              <span className="text-2xl font-extrabold text-[#2D241A] mt-1.5 block">4 Modules</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">LEARNERS REGISTERED</span>
              <span className="text-2xl font-extrabold text-[#2D241A] mt-1.5 block">48 Candidates</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">DAILY ATTENDANCE</span>
              <span className="text-2xl font-extrabold text-green-700 mt-1.5 block">94.2 %</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">ACTIVE BATCHES</span>
              <span className="text-2xl font-extrabold text-deep-gold mt-1.5 block">3 Slots</span>
            </div>
          </div>

          {/* Main sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Active Batches list */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col md:col-span-2">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#6B8E6F]">ROSTER MANAGEMENT</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3">Active Batches</h3>
              
              <div className="mt-4 space-y-3 flex-grow text-xs">
                {/* Batch 1 */}
                <div className="flex items-center justify-between p-4 bg-cream/40 border border-primary-gold/10 rounded-xl hover:bg-cream/75 transition-all">
                  <div className="space-y-1">
                    <span className="font-bold text-[#2D241A] block text-sm">Sewing &amp; Design (Intermediate)</span>
                    <span className="text-[10px] text-[#7D7061] block font-semibold">Mon, Wed, Fri | 10:00 AM - 12:00 PM</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="block font-bold text-green-700 bg-sage-green px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest border border-green-200">18 Enrolled</span>
                    <span className="block text-[10px] text-[#7D7061] font-bold">Lab #1 Room A</span>
                  </div>
                </div>

                {/* Batch 2 */}
                <div className="flex items-center justify-between p-4 bg-cream/40 border border-primary-gold/10 rounded-xl hover:bg-cream/75 transition-all">
                  <div className="space-y-1">
                    <span className="font-bold text-[#2D241A] block text-sm">Computer Basics &amp; Retail Coding</span>
                    <span className="text-[10px] text-[#7D7061] block font-semibold">Tue, Thu, Sat | 02:00 PM - 04:00 PM</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="block font-bold text-deep-gold bg-soft-yellow px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest border border-primary-gold/20">15 Enrolled</span>
                    <span className="block text-[10px] text-[#7D7061] font-bold">Lab #2 Room B</span>
                  </div>
                </div>

                {/* Batch 3 */}
                <div className="flex items-center justify-between p-4 bg-cream/40 border border-primary-gold/10 rounded-xl hover:bg-cream/75 transition-all">
                  <div className="space-y-1">
                    <span className="font-bold text-[#2D241A] block text-sm">Agro-Processing &amp; Packaged Foods</span>
                    <span className="text-[10px] text-[#7D7061] block font-semibold">Saturdays | 09:00 AM - 01:00 PM</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="block font-bold text-deep-rose bg-light-pink px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest border border-soft-rose/30">15 Enrolled</span>
                    <span className="block text-[10px] text-[#7D7061] font-bold">Outdoor Shed #1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Compliance */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-deep-gold">CENTRE CHECKS</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3">Compliance Logs</h3>
              
              <div className="mt-4 space-y-4 flex-grow text-xs text-[#7D7061]">
                <div className="p-4 bg-sage-green/50 rounded-xl border border-green-200 flex items-start space-x-3">
                  <FileCheck className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-green-900 block uppercase text-[10px] tracking-widest">Licensing Verified</span>
                    <span className="text-[11px] text-green-950 block leading-relaxed font-medium">Valid until Dec 2027 under National Skill Mission.</span>
                  </div>
                </div>

                <div className="p-4 bg-cream/40 rounded-xl border border-primary-gold/10 space-y-2">
                  <span className="font-bold text-[#2D241A] block uppercase text-[10px] tracking-widest text-deep-gold">Attendance Registers</span>
                  <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                    Please submit attendance records before 06:00 PM daily to ensure points multiplier calculation fires correctly.
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
