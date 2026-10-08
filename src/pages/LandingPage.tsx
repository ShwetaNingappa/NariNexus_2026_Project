import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  BookOpen, 
  MapPin, 
  Award, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Compass, 
  ChevronRight, 
  Smartphone,
  CheckCircle2,
  Lock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<'learner' | 'centre' | 'admin'>('learner');

  return (
    <div className="flex min-h-screen flex-col bg-cream text-[#3D2D1E]" id="landing-page-root">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-soft-rose/20 via-cream to-cream py-20 sm:py-28" id="hero-section">
          {/* Elegant Geometric Accent Shapes */}
          <div className="absolute top-10 left-10 h-32 w-32 rounded-3xl border border-primary-gold/10 opacity-40 transform rotate-12 -z-10" />
          <div className="absolute right-10 bottom-10 h-48 w-48 rounded-full border-2 border-primary-pink/15 opacity-30 transform -rotate-45 -z-10" />
          <div className="absolute left-1/4 top-1/2 h-20 w-20 rounded-full bg-soft-yellow/20 blur-xl -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-8">
              {/* Dynamic Tag */}
              <div className="inline-flex items-center space-x-2 rounded-full bg-white border border-primary-gold/20 px-4 py-1.5 text-[10px] font-extrabold tracking-widest text-deep-gold shadow-sm uppercase animate-fade-in-up">
                <Sparkles className="h-4 w-4 text-primary-pink animate-pulse" />
                <span>INTEGRATED WOMEN EMPOWERMENT & DIGITAL SKILLS PLATFORM</span>
              </div>

              {/* Title & Headline */}
              <h1 className="font-serif text-4xl font-extrabold tracking-tight text-[#2B1D11] sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl mx-auto leading-tight">
                Empowering Women Through{' '}
                <span className="text-primary-pink relative inline-block">
                  Skills
                  <span className="absolute left-0 bottom-1.5 h-1 w-full bg-soft-rose/50 -z-10" />
                </span>,{' '}
                <span className="text-deep-gold relative inline-block">
                  Learning
                  <span className="absolute left-0 bottom-1.5 h-1 w-full bg-soft-yellow/70 -z-10" />
                </span>{' '}
                &{' '}
                <span className="text-[#3D2D1E] relative inline-block">
                  Opportunities
                  <span className="absolute left-0 bottom-1.5 h-1 w-full bg-soft-peach/60 -z-10" />
                </span>
              </h1>

              {/* Description */}
              <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#6E5D4F] leading-relaxed font-medium">
                NariNexus is an AI-enabled multilingual hybrid skill development platform connecting offline practical learning with digital courses and localized income opportunities.
              </p>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  to="/learner"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-deep-rose to-primary-pink px-8 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-md hover:shadow-lg hover:from-primary-pink hover:to-deep-rose hover:scale-[1.02] active:scale-95 transition-all duration-300"
                  id="btn-explore-skills"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Explore Courses
                </Link>
                <Link
                  to="/centre"
                  className="inline-flex items-center justify-center rounded-full bg-white border-2 border-primary-gold px-8 py-4 text-xs font-bold uppercase tracking-widest text-deep-gold shadow-sm hover:shadow-md hover:bg-soft-yellow/20 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                  id="btn-find-centre"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Find Coaching Centre
                </Link>
              </div>

              {/* Quick statistics / Social Proof */}
              <div className="mt-16 grid grid-cols-2 gap-6 border-t border-primary-gold/15 pt-12 md:grid-cols-4 max-w-4xl mx-auto">
                <div className="text-center p-4 rounded-2xl bg-white/40 border border-primary-gold/5">
                  <span className="block text-3xl sm:text-4xl font-black text-primary-pink">15+</span>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#7D7061] mt-1.5 block">Vibrant Languages</span>
                </div>
                <div className="text-center p-4 rounded-2xl bg-white/40 border border-primary-gold/5">
                  <span className="block text-3xl sm:text-4xl font-black text-deep-gold">50+</span>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#7D7061] mt-1.5 block">Coaching Centres</span>
                </div>
                <div className="text-center p-4 rounded-2xl bg-white/40 border border-primary-gold/5">
                  <span className="block text-3xl sm:text-4xl font-black text-[#3D2D1E]">1200+</span>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#7D7061] mt-1.5 block">Active Learners</span>
                </div>
                <div className="text-center p-4 rounded-2xl bg-white/40 border border-primary-gold/5">
                  <span className="block text-3xl sm:text-4xl font-black text-green-700">92%</span>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#7D7061] mt-1.5 block">Employment Rate</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Project Vision & Intro */}
        <section className="bg-white py-20 border-t border-primary-gold/15" id="vision-intro">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-pink bg-light-pink px-3 py-1 rounded-full border border-primary-pink/10">THE PROBLEM & SOLUTION</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2B1D11] leading-tight">
                  Redefining the Learning Ecosystem for Every Woman
                </h2>
                <p className="text-xs sm:text-sm text-[#6E5D4F] leading-relaxed">
                  Traditional vocational training often operates in silos, lacking localized accessibility, native language delivery, or active market linkage. NariNexus bridges these gaps through a modular hybrid framework.
                </p>
                <div className="space-y-4 pt-2">
                  <div className="flex items-start">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-green text-green-700 shrink-0 mt-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#2B1D11]">Native Multilingual Support</h4>
                      <p className="text-xs text-[#7D7061] mt-1">Overcome digital barriers by learning complex skills in regional native dialects.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-light-pink text-primary-pink shrink-0 mt-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#2B1D11]">Hybrid Offline/Online Integration</h4>
                      <p className="text-xs text-[#7D7061] mt-1">Combine digital online study with physical, practical, hands-on labs at verified neighborhood centers.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Visual Card */}
              <div className="relative rounded-2xl border border-primary-gold/15 bg-cream/50 p-8 shadow-sm">
                <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 bg-sage-green text-green-800 rounded-full border border-green-200">Vision Blueprint</span>
                <h3 className="font-serif text-xl font-bold text-[#2B1D11] mb-6 border-b border-primary-gold/15 pb-3">Empowerment Lifecycle</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-primary-gold/10 hover-lift">
                    <span className="text-[9px] font-extrabold text-primary-pink uppercase block tracking-widest mb-1">Step 01</span>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#2B1D11]">Discover & Match</span>
                    <p className="text-xs text-[#7D7061] mt-1">Select preferred language and interests; match with nearby skill development modules.</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-primary-gold/10 hover-lift">
                    <span className="text-[9px] font-extrabold text-deep-gold uppercase block tracking-widest mb-1">Step 02</span>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#2B1D11]">Acquire Competency</span>
                    <p className="text-xs text-[#7D7061] mt-1">Learn digital components on-device; complete offline, hands-on practice in validated batches.</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-primary-gold/10 hover-lift">
                    <span className="text-[9px] font-extrabold text-green-700 uppercase block tracking-widest mb-1">Step 03</span>
                    <span className="font-bold text-xs uppercase tracking-wider text-[#2B1D11]">Get Certified & Link with Market</span>
                    <p className="text-xs text-[#7D7061] mt-1">Earn credentials, points, and badging linked straight to localized jobs or self-employment circles.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-cream/40 py-20 border-t border-primary-gold/15" id="features-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-pink bg-light-pink px-3 py-1 rounded-full border border-primary-pink/10">ELEVATING CAPABILITIES</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2B1D11]">
                Powerful Platform Pillars Built for Impact
              </h2>
              <p className="text-xs sm:text-sm text-[#6E5D4F]">
                Our architecture prepares NariNexus to scale with cutting-edge modules supporting practical education, verification, and economic growth.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-primary-gold/10 bg-white p-6 shadow-sm hover-lift">
                <div className="inline-flex h-12 w-12 items-center justify-center bg-light-pink text-primary-pink rounded-xl">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-[#2B1D11]">Multilingual-First</h3>
                <p className="mt-2.5 text-xs text-[#7D7061] leading-relaxed">
                  Engineered to dynamically translate and narrate lessons in native regional dialects, enabling rural women with diverse literacy profiles to adapt swiftly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-primary-gold/10 bg-white p-6 shadow-sm hover-lift">
                <div className="inline-flex h-12 w-12 items-center justify-center bg-soft-yellow text-deep-gold rounded-xl">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-[#2B1D11]">AI Mentorship (Future)</h3>
                <p className="mt-2.5 text-xs text-[#7D7061] leading-relaxed">
                  Intelligent chatbot integration powered by Gemini for immediate doubts resolution, curriculum guidance, and customized job advice.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-primary-gold/10 bg-white p-6 shadow-sm hover-lift">
                <div className="inline-flex h-12 w-12 items-center justify-center bg-soft-peach text-primary-pink rounded-xl">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-[#2B1D11]">Gamified Badges</h3>
                <p className="mt-2.5 text-xs text-[#7D7061] leading-relaxed">
                  Motivate persistent skill acquisition with streak counters, score charts, dynamic badges, and customizable reward tiers that keep learning fun.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-2xl border border-primary-gold/10 bg-white p-6 shadow-sm hover-lift">
                <div className="inline-flex h-12 w-12 items-center justify-center bg-sage-green text-green-700 rounded-xl">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-[#2B1D11]">Geo-Location</h3>
                <p className="mt-2.5 text-xs text-[#7D7061] leading-relaxed">
                  Map-integrated training directories helping users instantly locate and enroll in nearby sewing, computer, craftsmanship, or agriculture labs.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-2xl border border-primary-gold/10 bg-white p-6 shadow-sm hover-lift">
                <div className="inline-flex h-12 w-12 items-center justify-center bg-light-pink text-deep-rose rounded-xl">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-[#2B1D11]">Employment Linking</h3>
                <p className="mt-2.5 text-xs text-[#7D7061] leading-relaxed">
                  Direct pipelines mapping validated credentials and acquired skill batches directly to local businesses, boutique hubs, or self-help groups.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-2xl border border-primary-gold/10 bg-white p-6 shadow-sm hover-lift">
                <div className="inline-flex h-12 w-12 items-center justify-center bg-soft-yellow text-deep-gold rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-[#2B1D11]">Micro-Cohorts</h3>
                <p className="mt-2.5 text-xs text-[#7D7061] leading-relaxed">
                  Promote peer-to-peer discussion, mutual tutoring, and group-driven hands-on practice, mirroring traditional trusted village councils.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three-Role Ecosystem Interactive Selector */}
        <section className="bg-white py-20 border-t border-primary-gold/15" id="roles-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-pink bg-light-pink px-3 py-1 rounded-full border border-primary-pink/10">COOPERATIVE SYNERGY</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2B1D11]">
                A Triple-Role Connected Platform
              </h2>
              <p className="text-xs sm:text-sm text-[#6E5D4F]">
                NariNexus connects Learners, Coaching Centres, and Administrators in a verified loop of practical learning and secure evaluation.
              </p>
            </div>

            {/* Selector Buttons */}
            <div className="mt-12 flex justify-center space-x-2 border-b border-primary-gold/15 max-w-lg mx-auto pb-px">
              <button
                onClick={() => setSelectedRole('learner')}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
                  selectedRole === 'learner' 
                    ? 'border-primary-pink text-primary-pink font-extrabold' 
                    : 'border-transparent text-[#7D7061] hover:text-[#2B1D11]'
                }`}
              >
                1. Learner Portal
              </button>
              <button
                onClick={() => setSelectedRole('centre')}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
                  selectedRole === 'centre' 
                    ? 'border-green-600 text-green-700 font-extrabold' 
                    : 'border-transparent text-[#7D7061] hover:text-[#2B1D11]'
                }`}
              >
                2. Coaching Centre
              </button>
              <button
                onClick={() => setSelectedRole('admin')}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 cursor-pointer ${
                  selectedRole === 'admin' 
                    ? 'border-deep-gold text-deep-gold font-extrabold' 
                    : 'border-transparent text-[#7D7061] hover:text-[#2B1D11]'
                }`}
              >
                3. Administrator
              </button>
            </div>

            {/* Selector Content Card */}
            <div className="mt-10 max-w-4xl mx-auto rounded-2xl border border-primary-gold/15 bg-cream/40 p-8 shadow-sm">
              {selectedRole === 'learner' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in-up">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-full bg-light-pink text-deep-rose border border-soft-rose">Aspiring Women & Girls</span>
                    <h3 className="font-serif text-2xl font-bold text-[#2B1D11]">Learn regional skills, grow locally</h3>
                    <p className="text-xs sm:text-sm text-[#6E5D4F] leading-relaxed">
                      Register, select interests, take courses, join interactive batches at neighboring validated centers, and discover earnings paths.
                    </p>
                    <Link
                      to="/learner"
                      className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-deep-rose hover:text-primary-pink transition-colors"
                    >
                      Enter Learner Shell <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-primary-gold/10 space-y-4 shadow-sm">
                    <h4 className="font-bold uppercase tracking-wider text-deep-rose text-xs">Learner Action Items</h4>
                    <ul className="space-y-3 text-xs text-[#6E5D4F]">
                      <li className="flex items-center"><CheckCircle2 className="h-4.5 w-4.5 mr-2.5 text-deep-rose shrink-0" /> Select language & complete profile</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4.5 w-4.5 mr-2.5 text-deep-rose shrink-0" /> Select online/offline hybrid learning path</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4.5 w-4.5 mr-2.5 text-deep-rose shrink-0" /> Maintain streaks and earn gamified points</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedRole === 'centre' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in-up">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-full bg-sage-green text-green-800 border border-green-300">Verified Training Hubs</span>
                    <h3 className="font-serif text-2xl font-bold text-[#2B1D11]">Host robust training batches</h3>
                    <p className="text-xs sm:text-sm text-[#6E5D4F] leading-relaxed">
                      Join as a verified NGO or government coaching partner. Create curriculum plans, register batches, log attendance, and update skills progress.
                    </p>
                    <Link
                      to="/centre"
                      className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-green-700 hover:text-green-900 transition-colors"
                    >
                      Enter Centre Shell <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-primary-gold/10 space-y-4 shadow-sm">
                    <h4 className="font-bold uppercase tracking-wider text-green-700 text-xs">Coaching Centre Actions</h4>
                    <ul className="space-y-3 text-xs text-[#6E5D4F]">
                      <li className="flex items-center"><CheckCircle2 className="h-4.5 w-4.5 mr-2.5 text-green-700 shrink-0" /> Register and submit verification files</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4.5 w-4.5 mr-2.5 text-green-700 shrink-0" /> Manage active course syllabi and batch timing</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4.5 w-4.5 mr-2.5 text-green-700 shrink-0" /> Grade learner attendance and practical outcomes</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedRole === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-fade-in-up">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest rounded-full bg-soft-yellow text-deep-gold border border-primary-gold/30">Supervisory Dashboard</span>
                    <h3 className="font-serif text-2xl font-bold text-[#2B1D11]">Govern platform and ensure compliance</h3>
                    <p className="text-xs sm:text-sm text-[#6E5D4F] leading-relaxed">
                      Approve/reject new coaching hubs, evaluate reports, supervise operations, and track overall analytics on localized employment metrics.
                    </p>
                    <Link
                      to="/admin"
                      className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-deep-gold hover:text-primary-gold transition-colors"
                    >
                      Enter Admin Shell <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-primary-gold/10 space-y-4 shadow-sm">
                    <h4 className="font-bold uppercase tracking-wider text-deep-gold text-xs">Administrative Capabilities</h4>
                    <ul className="space-y-3 text-xs text-[#6E5D4F]">
                      <li className="flex items-center"><CheckCircle2 className="h-4.5 w-4.5 mr-2.5 text-deep-gold shrink-0" /> Verify coaching centers and manage reporting</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4.5 w-4.5 mr-2.5 text-deep-gold shrink-0" /> Oversee points-multiplier and badging values</li>
                      <li className="flex items-center"><CheckCircle2 className="h-4.5 w-4.5 mr-2.5 text-deep-gold shrink-0" /> Review comprehensive activity dashboards</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
