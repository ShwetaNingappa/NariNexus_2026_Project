import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Tag, 
  Save, 
  Edit3, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  Sparkles,
  Layers,
  FileText,
  UserCheck,
  Plus,
  Trash2,
  Tv,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CentreProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile data state
  const [profileExists, setProfileExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [centreName, setCentreName] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [emailAddress, setEmailAddress] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [locationCoords, setLocationCoords] = useState('');
  const [facilityInput, setFacilityInput] = useState('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');

  // Training Delivery Mode states
  const [trainingMode, setTrainingMode] = useState('online'); // 'online' | 'offline' | 'hybrid'
  
  // Online state
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoDuration, setVideoDuration] = useState('15 mins');
  const [videoOrder, setVideoOrder] = useState(1);
  const [videos, setVideos] = useState<any[]>([]);

  // Offline state
  const [offAddress, setOffAddress] = useState('');
  const [offVillage, setOffVillage] = useState('');
  const [offCity, setOffCity] = useState('');
  const [offDistrict, setOffDistrict] = useState('');
  const [offState, setOffState] = useState('');
  const [offPincode, setOffPincode] = useState('');
  const [offLat, setOffLat] = useState('');
  const [offLon, setOffLon] = useState('');
  const [offDays, setOffDays] = useState('Monday – Friday');
  const [offStartTime, setOffStartTime] = useState('10:00 AM');
  const [offEndTime, setOffEndTime] = useState('1:00 PM');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/centres/me');
      if (response.data && response.data.success && response.data.profile) {
        const p = response.data.profile;
        setProfileExists(true);
        setCentreName(p.centre_name || '');
        setDescription(p.description || '');
        setContactPhone(p.contact_phone || '');
        setEmailAddress(p.email || '');
        setAddress(p.address || '');
        setCity(p.city || '');
        setDistrict(p.district || '');
        setState(p.state || '');
        setPincode(p.pincode || '');
        setLocationCoords(p.location || '');
        setFacilities(p.facilities || []);
        setLogoUrl(p.logo || '');
        setCoverImageUrl(p.cover_image || '');
        setVerificationStatus(p.verification_status || 'pending');
        
        // Populating training mode delivery configurations
        setTrainingMode(p.training_mode || 'online');
        setVideos(p.online_training?.videos || []);
        
        const off = p.offline_training;
        setOffAddress(off?.address || '');
        setOffVillage(off?.village || '');
        setOffCity(off?.city || '');
        setOffDistrict(off?.district || '');
        setOffState(off?.state || '');
        setOffPincode(off?.pincode || '');
        setOffLat(off?.latitude?.toString() || '');
        setOffLon(off?.longitude?.toString() || '');
        setOffDays(off?.available_days || 'Monday – Friday');
        setOffStartTime(off?.start_time || '10:00 AM');
        setOffEndTime(off?.end_time || '1:00 PM');

        setIsEditing(false);
      } else {
        setProfileExists(false);
        setIsEditing(true); // default to edit/create mode if no profile exists
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setProfileExists(false);
        setIsEditing(true);
      } else {
        setError('Failed to fetch your centre profile. Please try again.');
        console.error('Error fetching profile:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddFacility = () => {
    if (facilityInput.trim() && !facilities.includes(facilityInput.trim())) {
      setFacilities([...facilities, facilityInput.trim()]);
      setFacilityInput('');
    }
  };

  const handleRemoveFacility = (index: number) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  // YouTube Link check
  const isValidYouTubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\/.+$/;
    return pattern.test(url);
  };

  const handleAddVideo = () => {
    if (!videoTitle.trim()) {
      alert('Please enter a video title.');
      return;
    }
    if (!videoUrl.trim() || !isValidYouTubeUrl(videoUrl.trim())) {
      alert('Please enter a valid YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...)');
      return;
    }

    const newVideo = {
      title: videoTitle.trim(),
      youtube_url: videoUrl.trim(),
      description: videoDesc.trim() || '',
      duration: videoDuration.trim() || '15 mins',
      order: parseInt(videoOrder as any) || videos.length + 1
    };

    setVideos([...videos, newVideo].sort((a, b) => a.order - b.order));
    setVideoTitle('');
    setVideoUrl('');
    setVideoDesc('');
    setVideoDuration('15 mins');
    setVideoOrder(videos.length + 2);
  };

  const handleRemoveVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const handleModeChange = (newMode: string) => {
    setTrainingMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic Validation
    if (!centreName.trim() || !description.trim() || !contactPhone.trim() || !emailAddress.trim() || !address.trim() || !city.trim() || !district.trim() || !state.trim() || !pincode.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (pincode.trim().length !== 6 || !/^\d+$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }

    // Delivery-specific backend alignment validation
    if (trainingMode === 'online' || trainingMode === 'hybrid') {
      if (videos.length === 0) {
        setError('At least one valid YouTube training video must be provided for Online/Hybrid mode.');
        return;
      }
    }

    if (trainingMode === 'offline' || trainingMode === 'hybrid') {
      if (!offAddress.trim() || !offCity.trim() || !offDistrict.trim() || !offState.trim() || !offPincode.trim()) {
        setError('Complete physical location details (Address, City, District, State, PIN) are required for Offline/Hybrid mode.');
        return;
      }
      if (offPincode.trim().length !== 6 || !/^\d+$/.test(offPincode.trim())) {
        setError('Please enter a valid 6-digit offline pincode.');
        return;
      }
      if (!offDays.trim() || !offStartTime.trim() || !offEndTime.trim()) {
        setError('Please provide offline training session schedule (Days and Times).');
        return;
      }
    }

    const payload = {
      centre_name: centreName.trim(),
      description: description.trim(),
      contact_phone: contactPhone.trim(),
      email: emailAddress.trim(),
      address: address.trim(),
      city: city.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      location: locationCoords.trim() || null,
      facilities: facilities,
      logo: logoUrl.trim() || null,
      cover_image: coverImageUrl.trim() || null,
      training_mode: trainingMode,
      online_training: (trainingMode === 'online' || trainingMode === 'hybrid') ? { videos } : null,
      offline_training: (trainingMode === 'offline' || trainingMode === 'hybrid') ? {
        address: offAddress.trim(),
        village: offVillage.trim(),
        city: offCity.trim(),
        district: offDistrict.trim(),
        state: offState.trim(),
        pincode: offPincode.trim(),
        latitude: offLat.trim() ? parseFloat(offLat.trim()) : null,
        longitude: offLon.trim() ? parseFloat(offLon.trim()) : null,
        available_days: offDays.trim(),
        start_time: offStartTime.trim(),
        end_time: offEndTime.trim()
      } : null
    };

    setLoading(true);
    try {
      let response;
      if (profileExists) {
        // Edit existing profile
        response = await api.put('/api/centres/profile', payload);
      } else {
        // Create new profile
        response = await api.post('/api/centres/profile', payload);
      }

      if (response.data && response.data.success) {
        setSuccessMsg(profileExists ? 'Profile updated successfully!' : 'Centre Profile created successfully!');
        setProfileExists(true);
        setIsEditing(false);
        if (response.data.profile) {
          setVerificationStatus(response.data.profile.verification_status || 'pending');
        }
      } else {
        setError(response.data?.message || 'Failed to save profile. Please check validation rules.');
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setError(`${detail[0].loc.join('.')}: ${detail[0].msg}`);
      } else {
        setError('An error occurred while saving. Please ensure input sizes and phone/pin patterns are valid.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream text-[#3D2D1E]" id="centre-profile-root">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link to="/centre" className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-deep-gold hover:text-deep-rose group transition">
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>

          {profileExists && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 rounded-full border border-primary-gold/30 bg-white text-xs font-bold uppercase tracking-wider text-deep-gold hover:bg-soft-yellow/40 hover:text-[#2D241A] transition shadow-sm cursor-pointer animate-fadeIn"
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Verification Alert Info */}
        {profileExists && (
          <div className={`p-4 rounded-2xl border flex items-start gap-4 transition shadow-sm ${
            verificationStatus === 'verified' 
              ? 'bg-sage-green/45 border-green-200 text-green-900' 
              : 'bg-soft-yellow/40 border-primary-gold/15 text-[#4A3E31]'
          }`}>
            {verificationStatus === 'verified' ? (
              <CheckCircle className="h-6 w-6 text-green-700 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-primary-gold shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-left">
              <span className="text-xs uppercase font-extrabold tracking-wider block">
                {verificationStatus === 'verified' ? 'Verified Partner Centre' : 'Profile Status: Verification Pending'}
              </span>
              <p className="text-[11px] font-semibold leading-relaxed">
                {verificationStatus === 'verified' 
                  ? 'Your training centre is fully verified! Your profile is visible on the public discovery hub and learners can search for you.'
                  : 'Your profile registration is currently pending administrator verification. Once our audit completes, your courses and batches will go live for community enrollment.'}
              </p>
            </div>
          </div>
        )}

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-4 bg-soft-rose/30 border border-deep-rose/20 rounded-2xl text-xs text-deep-rose font-medium text-left">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-sage-green/30 border border-green-200 rounded-2xl text-xs text-green-800 font-bold text-left">
            {successMsg}
          </div>
        )}

        {loading && <div className="text-center py-12 text-xs font-bold uppercase tracking-widest text-[#7D7061]">Loading Centre Profile...</div>}

        {!loading && (
          <div className="bg-white rounded-2xl border border-primary-gold/15 overflow-hidden shadow-sm">
            {/* Header / Cover Hero */}
            <div className="h-44 bg-gradient-to-r from-deep-rose/20 via-primary-pink/10 to-primary-gold/10 relative flex items-end p-6 border-b border-primary-gold/10">
              {coverImageUrl && (
                <img 
                  src={coverImageUrl} 
                  alt="Centre Cover" 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-60" 
                />
              )}
              <div className="relative flex items-center space-x-4 z-10">
                <div className="h-16 w-16 rounded-xl bg-white border border-primary-gold/15 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" referrerPolicy="no-referrer" className="object-cover w-full h-full" />
                  ) : (
                    <Building2 className="h-8 w-8 text-primary-gold" />
                  )}
                </div>
                <div className="text-left">
                  <h2 className="font-serif text-xl font-extrabold text-[#2D241A]">
                    {centreName || 'Setup Your Training Centre'}
                  </h2>
                  <p className="text-[10px] uppercase font-extrabold tracking-widest text-[#7D7061]">
                    {city ? `${city}, ${state}` : 'Onboarding Profile Form'}
                  </p>
                </div>
              </div>
            </div>

            {/* Read Only Mode */}
            {profileExists && !isEditing ? (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Description & Delivery Details */}
                  <div className="md:col-span-2 space-y-6 text-left">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#7D7061] mb-2">About Our Centre</h3>
                      <p className="text-xs text-[#5D5041] font-semibold leading-relaxed whitespace-pre-wrap bg-cream/35 p-4 border border-primary-gold/10 rounded-xl">
                        {description}
                      </p>
                    </div>

                    {/* Dynamic Training Mode Overview display */}
                    <div className="p-5 border border-primary-gold/15 rounded-xl bg-[#FAF8F5] space-y-4">
                      <div className="flex items-center justify-between border-b border-primary-gold/10 pb-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#2D241A] flex items-center gap-1.5">
                          {trainingMode === 'online' && '🎥 Online Training Delivery'}
                          {trainingMode === 'offline' && '📍 Offline Physical Classroom'}
                          {trainingMode === 'hybrid' && '🔄 Hybrid Training Delivery'}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-deep-gold/15 px-2.5 py-1 text-deep-gold rounded-full">
                          {trainingMode}
                        </span>
                      </div>

                      {/* Online elements */}
                      {(trainingMode === 'online' || trainingMode === 'hybrid') && (
                        <div className="space-y-3">
                          <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#7D7061] block">
                            YouTube Lessons ({videos.length})
                          </span>
                          <div className="space-y-2">
                            {videos.map((vid, i) => (
                              <div key={i} className="bg-white p-3 rounded-xl border border-primary-gold/10 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-bold text-deep-gold uppercase block">Lesson {vid.order} • {vid.duration}</span>
                                  <span className="text-xs font-semibold text-[#2D241A] block">{vid.title}</span>
                                  {vid.description && <span className="text-[10px] text-[#7D7061] block mt-0.5">{vid.description}</span>}
                                </div>
                                <a 
                                  href={vid.youtube_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-deep-gold hover:text-deep-rose transition inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                >
                                  <span>Watch</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Offline elements */}
                      {(trainingMode === 'offline' || trainingMode === 'hybrid') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-[#5D5041] pt-1">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] block">Classroom Address</span>
                            <span className="text-[#2D241A]">{offAddress}</span>
                            {offVillage && <span className="block text-[10px] text-[#7D7061]">{offVillage}</span>}
                            <span className="block font-bold text-[#2D241A]">{offCity}, {offDistrict}, {offState} - {offPincode}</span>
                            {offLat && offLon && (
                              <span className="block text-[10px] font-mono text-[#7D7061] mt-1">Approx. Coordinates: {offLat}, {offLon}</span>
                            )}
                          </div>
                          <div className="bg-white p-3.5 rounded-xl border border-primary-gold/10 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-deep-gold shrink-0" />
                              <div>
                                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] block">Weekly Days</span>
                                <span>{offDays}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 border-t border-primary-gold/5 pt-1.5">
                              <Clock className="h-4 w-4 text-deep-gold shrink-0" />
                              <div>
                                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] block">Daily Timings</span>
                                <span>{offStartTime} – {offEndTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#7D7061] mb-2.5">Available Facilities</h3>
                      {facilities && facilities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {facilities.map((fac, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center px-3 py-1 bg-soft-yellow/60 border border-primary-gold/15 text-xs text-[#4A3E31] font-bold uppercase tracking-wider rounded-full"
                            >
                              <Layers className="mr-1 h-3 w-3 text-deep-gold" />
                              {fac}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#7D7061]/70 font-semibold italic">No specific facilities declared yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Contact & Core Profile details */}
                  <div className="space-y-4 bg-cream/30 p-5 rounded-2xl border border-primary-gold/10 text-left h-fit">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-deep-gold border-b border-primary-gold/10 pb-2.5">Centre Directory</h3>
                    
                    <div className="space-y-3.5 text-xs font-semibold text-[#5D5041]">
                      <div className="flex items-start gap-2.5">
                        <Phone className="h-4.5 w-4.5 text-deep-rose shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061]">Contact Number</span>
                          <span>{contactPhone}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Mail className="h-4.5 w-4.5 text-deep-rose shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061]">Official Email</span>
                          <span>{emailAddress}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4.5 w-4.5 text-deep-gold shrink-0 mt-0.5" />
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061]">Postal Address</span>
                          <span className="block leading-relaxed">{address}</span>
                          <span className="block font-bold text-[#2D241A] mt-0.5">{city}, {district}, {state} - {pincode}</span>
                        </div>
                      </div>

                      {locationCoords && (
                        <div className="border-t border-primary-gold/10 pt-3">
                          <span className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061]">HQ Coordinates</span>
                          <span className="block text-[11px] font-mono text-[#7D7061] mt-0.5">{locationCoords}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* Editable / Create Form Mode */
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#7D7061] border-b border-primary-gold/10 pb-2 text-left">
                  {profileExists ? 'Update Profile Credentials' : 'Provide Core Information'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Centre Name */}
                  <div className="md:col-span-2 text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      Training Centre Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Mahila Pragati Udyog Kendra"
                      value={centreName}
                      onChange={(e) => setCentreName(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2 text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      Centre Description *
                    </label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="Describe your training facilities, skill-building domains, certified courses, and social mission..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      Contact Phone *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 9988776600"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* Email */}
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      Official Email *
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. contact@mahilacentre.org"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* Training Mode Selector */}
                  <div className="md:col-span-2 bg-[#FAF8F5] p-5 rounded-2xl border border-primary-gold/15 space-y-4 text-left">
                    <label className="block text-xs font-extrabold text-deep-gold uppercase tracking-widest border-b border-primary-gold/10 pb-2">
                      Training Delivery Mode *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'online', label: 'Online Only', desc: 'YouTube learning content' },
                        { id: 'offline', label: 'Offline Only', desc: 'Physical coaching classes' },
                        { id: 'hybrid', label: 'Hybrid', desc: 'Both online & offline components' }
                      ].map((modeOpt) => (
                        <label 
                          key={modeOpt.id}
                          className={`flex flex-col p-4 rounded-xl border-2 transition cursor-pointer text-left ${
                            trainingMode === modeOpt.id 
                              ? 'bg-soft-yellow/45 border-deep-gold text-[#2D241A]' 
                              : 'bg-white border-primary-gold/10 hover:border-primary-gold/20 text-[#5D5041]'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <input 
                              type="radio" 
                              name="training_mode"
                              value={modeOpt.id}
                              checked={trainingMode === modeOpt.id}
                              onChange={() => handleModeChange(modeOpt.id)}
                              className="accent-deep-gold"
                            />
                            <span className="text-xs font-bold uppercase tracking-wider">{modeOpt.label}</span>
                          </div>
                          <span className="text-[10px] font-medium text-[#7D7061] mt-1.5">{modeOpt.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Online Training Input Fields Section */}
                  {(trainingMode === 'online' || trainingMode === 'hybrid') && (
                    <div className="md:col-span-2 bg-cream/15 p-5 rounded-2xl border border-primary-gold/15 space-y-4 text-left animate-fadeIn">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#7D7061] border-b border-primary-gold/10 pb-2 flex items-center gap-1.5">
                        🎥 Online YouTube Lectures Catalog *
                      </h4>
                      
                      <div className="bg-white p-4 rounded-xl border border-primary-gold/15 space-y-3">
                        <span className="block text-[10px] font-extrabold text-deep-gold uppercase tracking-widest">
                          Add a YouTube Video Lesson *
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <input 
                              type="text" 
                              placeholder="Video Title (e.g., Stitching Basics Part 1)"
                              value={videoTitle}
                              onChange={(e) => setVideoTitle(e.target.value)}
                              className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs text-[#2D241A] focus:border-deep-gold focus:outline-none"
                            />
                          </div>
                          <div>
                            <input 
                              type="text" 
                              placeholder="YouTube Link (e.g., https://youtu.be/...)"
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs text-[#2D241A] focus:border-deep-gold focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input 
                              type="text" 
                              placeholder="Optional short description"
                              value={videoDesc}
                              onChange={(e) => setVideoDesc(e.target.value)}
                              className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs text-[#2D241A] focus:border-deep-gold focus:outline-none"
                            />
                          </div>
                          <div>
                            <input 
                              type="text" 
                              placeholder="Duration (e.g., 15 mins)"
                              value={videoDuration}
                              onChange={(e) => setVideoDuration(e.target.value)}
                              className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs text-[#2D241A] focus:border-deep-gold focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              min={1}
                              placeholder="Order (e.g., 1)"
                              value={videoOrder}
                              onChange={(e) => setVideoOrder(parseInt(e.target.value) || 1)}
                              className="block flex-grow rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs text-[#2D241A] focus:border-deep-gold focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddVideo}
                              className="px-4 py-2 bg-deep-gold hover:bg-[#C8870A] text-white text-xs font-bold uppercase rounded-lg active:scale-95 transition"
                            >
                              Add Lesson
                            </button>
                          </div>
                        </div>
                      </div>

                      {videos.length > 0 ? (
                        <div className="space-y-2 mt-3 max-h-56 overflow-y-auto pr-1">
                          {videos.map((vid, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-primary-gold/10 rounded-xl">
                              <div className="text-left text-xs font-semibold">
                                <span className="text-[10px] text-deep-gold font-bold uppercase block">Lesson {vid.order} • {vid.duration}</span>
                                <span className="text-[#2D241A] block">{vid.title}</span>
                                <span className="text-[10px] text-[#7D7061] font-mono break-all block">{vid.youtube_url}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVideo(idx)}
                                className="text-deep-rose hover:text-[#C53030] transition p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-[#7D7061] italic text-left p-2 bg-white rounded-lg border border-dashed border-primary-gold/25">
                          At least one valid YouTube video must be added to provide online training lessons.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Offline Training Input Fields Section */}
                  {(trainingMode === 'offline' || trainingMode === 'hybrid') && (
                    <div className="md:col-span-2 bg-cream/15 p-5 rounded-2xl border border-primary-gold/15 space-y-4 text-left animate-fadeIn">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#7D7061] border-b border-primary-gold/10 pb-2 flex items-center gap-1.5">
                        📍 Offline Practical Classroom Details *
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        <div className="sm:col-span-2">
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            Classroom Street Address *
                          </label>
                          <input 
                            type="text" 
                            required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                            placeholder="Full physical street/building address"
                            value={offAddress}
                            onChange={(e) => setOffAddress(e.target.value)}
                            className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            Village / Town (Optional)
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. Basappa Layout"
                            value={offVillage}
                            onChange={(e) => setOffVillage(e.target.value)}
                            className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            City *
                          </label>
                          <input 
                            type="text" 
                            required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                            placeholder="e.g. Mysuru"
                            value={offCity}
                            onChange={(e) => setOffCity(e.target.value)}
                            className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            District *
                          </label>
                          <input 
                            type="text" 
                            required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                            placeholder="e.g. Mysuru District"
                            value={offDistrict}
                            onChange={(e) => setOffDistrict(e.target.value)}
                            className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            State *
                          </label>
                          <input 
                            type="text" 
                            required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                            placeholder="e.g. Karnataka"
                            value={offState}
                            onChange={(e) => setOffState(e.target.value)}
                            className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            PIN Code * (6 digits)
                          </label>
                          <input 
                            type="text" 
                            required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                            maxLength={6}
                            placeholder="e.g. 570001"
                            value={offPincode}
                            onChange={(e) => setOffPincode(e.target.value)}
                            className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            Classroom Latitude *
                          </label>
                          <input 
                            type="text" 
                            required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                            placeholder="e.g. 12.3087"
                            value={offLat}
                            onChange={(e) => setOffLat(e.target.value)}
                            className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            Classroom Longitude *
                          </label>
                          <input 
                            type="text" 
                            required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                            placeholder="e.g. 76.6548"
                            value={offLon}
                            onChange={(e) => setOffLon(e.target.value)}
                            className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            Available Training Days *
                          </label>
                          <input 
                            type="text" 
                            required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                            placeholder="e.g. Monday – Friday"
                            value={offDays}
                            onChange={(e) => setOffDays(e.target.value)}
                            className="block w-full rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] mb-1">
                            Daily Lesson Window * (Start - End)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="text" 
                              required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                              placeholder="e.g. 10:00 AM"
                              value={offStartTime}
                              onChange={(e) => setOffStartTime(e.target.value)}
                              className="block w-1/2 rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                            />
                            <span className="text-xs text-[#7D7061] font-bold">to</span>
                            <input 
                              type="text" 
                              required={trainingMode === 'offline' || trainingMode === 'hybrid'}
                              placeholder="e.g. 1:00 PM"
                              value={offEndTime}
                              onChange={(e) => setOffEndTime(e.target.value)}
                              className="block w-1/2 rounded-lg border border-primary-gold/15 bg-white px-3 py-2 text-xs font-semibold focus:border-deep-gold focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Postal Address */}
                  <div className="md:col-span-2 text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      Postal Street Address *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 12 Basappa Layout, Hosur Main Road"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* City */}
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      City *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Bengaluru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* District */}
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      District *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Bengaluru Urban"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* State */}
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      State *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Karnataka"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* Pincode */}
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      PIN Code * (6 Digits)
                    </label>
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      placeholder="e.g. 560029"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* GPS Coordinates (Optional) */}
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      Coordinates / Google Maps Link (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 12.9279, 77.6271"
                      value={locationCoords}
                      onChange={(e) => setLocationCoords(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* Logo URL */}
                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      Logo Image URL (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. https://images.unsplash.com/..."
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* Cover Image URL */}
                  <div className="md:col-span-2 text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      Cover Banner Image URL (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. https://images.unsplash.com/..."
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                    />
                  </div>

                  {/* Facilities Management */}
                  <div className="md:col-span-2 text-left">
                    <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                      Facilities &amp; Infrastructure
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. Computer lab with 10 terminals"
                        value={facilityInput}
                        onChange={(e) => setFacilityInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFacility(); } }}
                        className="block flex-grow rounded-xl border border-primary-gold/15 bg-white px-3.5 py-2.5 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none font-semibold transition"
                      />
                      <button
                        type="button"
                        onClick={handleAddFacility}
                        className="px-4 py-2 bg-deep-gold text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#C8870A] active:scale-95 transition cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {facilities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 p-3 bg-cream/40 border border-primary-gold/10 rounded-xl text-left">
                        {facilities.map((fac, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-2.5 py-1 bg-white border border-primary-gold/15 text-xs text-[#4A3E31] font-bold rounded-full"
                          >
                            {fac}
                            <button
                              type="button"
                              onClick={() => handleRemoveFacility(idx)}
                              className="ml-1.5 text-deep-rose hover:text-[#C53030] transition cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-primary-gold/10 pt-6">
                  {profileExists && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setError(null);
                      }}
                      className="px-6 py-3 rounded-full border border-primary-gold/15 bg-white text-xs font-bold uppercase tracking-widest text-[#7D7061] hover:bg-cream transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile details
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
