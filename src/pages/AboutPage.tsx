import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Compass, CheckCircle, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-[#3D2D1E]" id="about-page-root">
      <Navbar />

      <main className="flex-grow py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* Back button */}
          <Link to="/" className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-deep-gold hover:text-deep-rose mb-8 group transition-colors">
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>

          {/* Heading */}
          <div className="text-center md:text-left space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-pink bg-light-pink px-3.5 py-1 rounded-full border border-primary-pink/15">ACADEMIC FINAL-YEAR MAJOR PROJECT</span>
            <h1 className="font-serif text-3xl font-extrabold tracking-tight text-[#2D241A] sm:text-4xl">
              NariNexus Vision &amp; Problem Statement
            </h1>
            <p className="text-xs sm:text-sm text-[#7D7061] max-w-2xl leading-relaxed font-medium">
              Discover how NariNexus combines AI intelligence, native language assistance, and neighborhood verification to foster women-led digital literacy, economic autonomy, and leadership.
            </p>
          </div>

          {/* Problem section */}
          <div className="mt-12 rounded-2xl border border-primary-gold/15 bg-white p-8 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-[#2D241A] flex items-center uppercase tracking-wider border-b border-primary-gold/10 pb-4">
              <span className="mr-3 flex h-8 w-8 items-center justify-center bg-light-pink text-primary-pink rounded-full text-sm font-bold border border-soft-rose/50">
                ⚠️
              </span>
              The Problem Statement
            </h2>
            <p className="mt-4 text-xs text-[#7D7061] leading-relaxed font-medium">
              Traditional skill development systems for women often struggle with barriers in three specific areas:
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-cream/30 border border-primary-gold/10">
                <span className="font-extrabold text-[10px] uppercase tracking-widest text-[#2D241A] block text-deep-gold">1. Language Barriers</span>
                <p className="text-xs text-[#6E5D4F] mt-2.5 leading-relaxed font-medium">Most online competency materials are exclusively delivered in English or highly formal languages, excluding candidates with lower English digital literacy.</p>
              </div>
              <div className="p-5 rounded-xl bg-cream/30 border border-primary-gold/10">
                <span className="font-extrabold text-[10px] uppercase tracking-widest text-[#2D241A] block text-deep-gold">2. Isolation & Lack of Labs</span>
                <p className="text-xs text-[#6E5D4F] mt-2.5 leading-relaxed font-medium">Practical, hands-on skills (sewing, computer, craft) cannot be learned purely on screens. Traditional portals lack physical lab listings or batch structures.</p>
              </div>
              <div className="p-5 rounded-xl bg-cream/30 border border-primary-gold/10">
                <span className="font-extrabold text-[10px] uppercase tracking-widest text-[#2D241A] block text-deep-gold">3. Missing Employment Links</span>
                <p className="text-xs text-[#6E5D4F] mt-2.5 leading-relaxed font-medium">After acquiring certifications, there is no direct link connecting candidates directly with neighboring business circles, boutiques, or packaging shops.</p>
              </div>
            </div>
          </div>

          {/* Solution section */}
          <div className="mt-8 rounded-2xl border border-green-200 bg-sage-green/60 p-8 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-green-900 flex items-center uppercase tracking-wider border-b border-green-200/50 pb-4">
              <Compass className="mr-3 h-6 w-6 text-green-700" />
              The Proposed Solution: NariNexus
            </h2>
            <p className="mt-4 text-xs text-green-900 leading-relaxed font-semibold">
              NariNexus answers these structural constraints by building an **AI-Enabled Multilingual Hybrid Skill Development &amp; Women Empowerment Platform**. We solve these challenges through several core innovations:
            </p>
            <ul className="mt-6 space-y-3.5 text-xs text-green-950 leading-relaxed font-medium">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2.5 text-green-700 shrink-0 mt-0.5" />
                <span><strong>Modular Multi-Role Dashboards:</strong> Dedicated, accessible visual layouts for Learners (to study and track streaks), Coaching Centres (to run classes and register batches), and Administrators (to verify and moderate).</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2.5 text-green-700 shrink-0 mt-0.5" />
                <span><strong>Multilingual Core Support:</strong> Designed to host translated audio and localized content, removing digital navigation anxiety.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2.5 text-green-700 shrink-0 mt-0.5" />
                <span><strong>Reliable Database Connections:</strong> Connected to MongoDB Atlas to secure learner progress, user records, and center validations.</span>
              </li>
            </ul>
          </div>

          {/* Academic Team details */}
          <div className="mt-12 border-t border-primary-gold/15 pt-12">
            <h3 className="font-serif text-base font-bold text-deep-gold text-center mb-8 uppercase tracking-widest">Project Metadata &amp; Implementation Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-5 rounded-2xl border border-primary-gold/10 bg-white space-y-2 shadow-sm">
                <span className="font-extrabold block uppercase tracking-widest text-primary-pink text-[10px]">Frontend Stack</span>
                <p className="text-[#7D7061] leading-relaxed font-medium">React.js, Vite, Tailwind CSS v4, Lucide Icons, Axios for relative API health pooling, React Router Dom for clientside route navigation.</p>
              </div>
              <div className="p-5 rounded-2xl border border-primary-gold/10 bg-white space-y-2 shadow-sm">
                <span className="font-extrabold block uppercase tracking-widest text-deep-gold text-[10px]">Backend Stack</span>
                <p className="text-[#7D7061] leading-relaxed font-medium">Python FastAPI, PyMongo driver connection, Pydantic data modeling schemas, local development CORS middleware, standard health verification endpoints.</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
