import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Globe, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1E150C] text-[#FFF9F0] border-t border-primary-gold/20" id="nari-footer">
      {/* Upper Footer section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-deep-gold to-primary-gold shadow-md text-white shrink-0">
                <span className="text-sm font-bold tracking-tight font-serif">N</span>
              </div>
              <span className="font-serif text-lg font-extrabold tracking-widest text-[#FFF9F0]">
                NARINEXUS
              </span>
            </div>
            <p className="text-xs text-[#C5B3A5] leading-relaxed">
              An AI-enabled multilingual hybrid skill development platform empowering women through digital competency, practical courses, and localized employment pathways.
            </p>
            <div className="flex items-center space-x-2 text-xs text-primary-gold font-semibold tracking-widest uppercase">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Elevating lives, enabling skills</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-primary-gold">
              Ecosystem Roles
            </h3>
            <ul className="mt-4 space-y-2 text-xs text-[#C5B3A5]">
              <li>
                <Link to="/learner" className="hover:text-white hover:underline hover:text-primary-pink transition-all">Learner Portal</Link>
              </li>
              <li>
                <Link to="/centre" className="hover:text-white hover:underline hover:text-sage-green transition-all">Coaching Centre Portal</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white hover:underline hover:text-soft-yellow transition-all">Platform Administration</Link>
              </li>
            </ul>
          </div>

          {/* Core Features info */}
          <div>
            <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-primary-gold">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2 text-xs text-[#C5B3A5]">
              <li>
                <Link to="/" className="hover:text-white hover:underline transition-all">Platform Home</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white hover:underline transition-all">About Project Vision</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white hover:underline transition-all">Access Portal</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white hover:underline transition-all">New Registration</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-primary-gold">
              Project Contact
            </h3>
            <ul className="mt-4 space-y-3 text-xs text-[#C5B3A5]">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary-gold" />
                <span>support@narinexus.org</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary-gold" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary-gold" />
                <span>National Skill Mission Center, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Lower credit/legal section */}
        <div className="mt-12 border-t border-[#3A2E22] pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-[#C5B3A5]">
          <p>
            &copy; {currentYear} NariNexus Project. Built as an Engineering Final Year Major Project. All Rights Reserved.
          </p>
          <div className="mt-4 md:mt-0 flex items-center space-x-1">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 text-primary-pink fill-primary-pink" />
            <span>for Women Empowerment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
