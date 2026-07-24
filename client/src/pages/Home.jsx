import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import logo from "../assets/logo.jpeg";
import {
  Building,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  Mail,
  Phone,
  Menu,
  Star,
  Wifi,
  ShieldCheck,
} from 'lucide-react';
import { getAllHostels } from '../api/hostelApi.js';
import { getHeroSlides } from '../api/heroSlideApi.js';
import Loader from '../components/Loader.jsx';

// Shown only if the Super Admin hasn't configured any hero slides yet (or the
// fetch fails), so the landing page never renders an empty slider.
const FALLBACK_SLIDES = [
  { image: '/hostel_room_hero.png', label: 'Comfortable Dorms' },
  { image: '/hostel_lobby.png', label: 'Modern Lounges' },
  { image: '/hostel_study.png', label: 'Quiet Study Zones' },
];

const Home = () => {
  const { token } = useSelector((state) => state.auth);
  const location = useLocation();
  const authLinkState = { background: location };

  const [slide, setSlide] = useState(0);
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [paused, setPaused] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [cityQuery, setCityQuery] = useState('');
  const [hostelQuery, setHostelQuery] = useState('');
  const timerRef = useRef(null);

  // track scroll for navbar style + active section
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      const sections = ['hostels', 'about'];
      let current = 'home';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // fetch hostels
  useEffect(() => {
    getAllHostels()
      .then((res) => { if (res.success) setHostels(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // fetch super-admin-managed hero slider images
  useEffect(() => {
    getHeroSlides()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setSlides(res.data.map((s) => ({ image: s.image, label: s.label })));
          setSlide(0);
        }
      })
      .catch(() => {
        // keep FALLBACK_SLIDES on failure
      });
  }, []);

  // auto-advance slider
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, slides.length]);

  const prev = () => { clearInterval(timerRef.current); setSlide((s) => (s - 1 + slides.length) % slides.length); };
  const next = () => { clearInterval(timerRef.current); setSlide((s) => (s + 1) % slides.length); };

  // client-side filter — the /hostels endpoint already returns city + name for every hostel
  const filteredHostels = hostels.filter((h) => {
    const cityMatch = cityQuery.trim() ? (h.city || '').toLowerCase().includes(cityQuery.trim().toLowerCase()) : true;
    const nameMatch = hostelQuery.trim() ? (h.name || '').toLowerCase().includes(hostelQuery.trim().toLowerCase()) : true;
    return cityMatch && nameMatch;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    document.getElementById('hostels')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[#fdf4f0] text-[#2a1a12] font-sans flex flex-col">

      {/* ── NAVBAR (fixed, always solid — does not scroll with the page) ── */}
      <header className={`fixed top-0 inset-x-0 z-50 
        bg-white/95 backdrop-blur-xl
        border-b border-[#eaddd5]/70 transition-shadow duration-500 ${
        scrolled ? 'shadow-[0_2px_20px_rgba(0,40,142,0.07)] py-2' : 'py-2.5'
      }`}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-[auto_1fr_auto] items-center gap-8">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
   <div className="w-10 h-10 rounded-xl bg-[#e6472d] flex items-center justify-center font-bold text-white shadow-lg shadow-[#e6472d]/20">
                         <img
                src={logo}
                alt="CzHostel Logo"
                className="w-10 h-10 object-cover rounded-xl"
              />
            </div>
            <div className="flex flex-col leading-none gap-[3px]">
              <span className="font-black text-[14px] tracking-tight text-[#e6472d]">
                CzHostel
              </span>
              
            </div>
          </Link>

          {/* ── Desktop nav links (centered) ── */}
          <nav className="hidden md:flex items-center justify-center gap-2">
            {[
              { href: '#home',    label: 'Home',    id: 'home'    },
              { href: '#hostels', label: 'Hostels', id: 'hostels' },
              { href: '#about',   label: 'About',   id: 'about'   },
            ].map(({ href, label, id, badge }) => (
              <a
                key={id}
                href={href}
                className={`relative flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                  activeSection === id
                    ? 'text-[#e6472d] bg-[#fdece6]'
                    : 'text-[#6b5c54] hover:text-[#e6472d] hover:bg-[#fdece6]'
                }`}
              >
                {label}
                {/* active dot */}
                {activeSection === id && (
                  <span className="w-1 h-1 rounded-full bg-[#e6472d]" />
                )}
                {badge > 0 && activeSection !== id && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none bg-[#fdece6] text-[#6b5c54]">
                    {badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* ── Desktop CTA ── */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <Link
              to="/login" state={authLinkState}
              className="group flex items-center gap-1.5 px-5 py-2 text-[13px] font-bold rounded-full transition-all duration-200 bg-[#e6472d] text-white hover:bg-[#c73a22] shadow-md shadow-[#e6472d]/20"
            >
              Log In
            </Link>
            <Link
              to="/register" state={authLinkState}
              className="group flex items-center gap-1.5 px-5 py-2 text-[13px] font-bold rounded-full transition-all duration-200 bg-[#e6472d] text-white hover:bg-[#c73a22] shadow-md shadow-[#e6472d]/20"
            >
              Sign Up
             
            </Link>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="md:hidden col-start-3 justify-self-end relative w-9 h-9 rounded-lg flex items-center justify-center text-[#6b5c54] hover:bg-[#fdece6] transition-all duration-200"
          >
            <span className={`absolute transition-all duration-200 ${navOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}><X size={20} /></span>
            <span className={`absolute transition-all duration-200 ${navOpen ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}><Menu size={20} /></span>
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${navOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${navOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setNavOpen(false)}
        />
        {/* panel */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out ${navOpen ? 'translate-x-0' : 'translate-x-full'}`}>

          {/* panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eaddd5]/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e6472d] to-[#c73a22] flex items-center justify-center shadow">
                <Building size={16} className="text-white" />
              </div>
              <div>
                <p className="font-black text-[#e6472d] text-sm leading-none">CzHostel</p>
                <p className="text-[9px] text-[#9c8b83] font-semibold uppercase tracking-wider mt-0.5">Student Housing Platform</p>
              </div>
            </div>
            <button onClick={() => setNavOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#fdece6] text-[#9c8b83] flex items-center justify-center transition-colors">
              <X size={17} />
            </button>
          </div>

          

          {/* nav links */}
          <nav className="flex flex-col gap-1 px-4 pt-5 pb-3">
            <p className="text-[9px] font-black text-[#9c8b83] uppercase tracking-widest px-3 mb-2">Navigation</p>
            {[
              { href: '#home',    label: 'Home',           icon: '🏠'      },
              { href: '#hostels', label: 'Browse Hostels', icon: '🏢'},
              { href: '#about',   label: 'About Us',       icon: 'ℹ️'},
            ].map(({ href, label, icon, desc }) => (
              <a
                key={href}
                href={href}
                onClick={() => setNavOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[#6b5c54] hover:bg-[#fdece6] hover:text-[#e6472d] transition-all group"
              >
                <span className="w-9 h-9 rounded-xl bg-[#fdece6] group-hover:bg-[#fbe0d6] flex items-center justify-center text-base shrink-0 transition-colors">{icon}</span>
                <div className="flex flex-col leading-none gap-0.5">
                  <span>{label}</span>
                  <span className="text-[10px] text-[#9c8b83] font-normal group-hover:text-[#e6472d]/60">{desc}</span>
                </div>
                
              </a>
            ))}
          </nav>

         
          {/* CTA buttons */}
          <div className="flex flex-col gap-2.5 mt-auto px-4 py-5 border-t border-[#eaddd5]/60">
            <Link
              to="/login" state={authLinkState}
              onClick={() => setNavOpen(false)}
              className="w-full py-3.5 text-center bg-gradient-to-r from-[#e6472d] to-[#c73a22] text-white font-bold rounded-full text-sm hover:opacity-90 transition-all shadow-lg shadow-[#e6472d]/25 flex items-center justify-center gap-2"
            >
              Log In 
            </Link>
            <Link
              to="/register" state={authLinkState}
              onClick={() => setNavOpen(false)}
              className="w-full py-3.5 text-center bg-gradient-to-r from-[#e6472d] to-[#c73a22] text-white font-bold rounded-full text-sm hover:opacity-90 transition-all shadow-lg shadow-[#e6472d]/25 flex items-center justify-center gap-2"
            >
              Sign UP
            </Link>
          </div>
        </div>
      </div>

      {/* ── HERO IMAGE SLIDER (image-only, sits directly below the fixed navbar) ── */}
      <section
        id="home"
        className="relative w-full h-[42vh] sm:h-[56vh] lg:h-[64vh] min-h-[260px] max-h-[640px] overflow-hidden mt-[72px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* slides */}
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img src={s.image} alt={s.label} className="w-full h-full object-cover" />
          </div>
        ))}

        {/* slide indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>

        {/* arrow controls */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm flex items-center justify-center transition-all"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm flex items-center justify-center transition-all"
        >
          <ChevronRight size={22} />
        </button>
      </section>

      {/* ── FLOATING PILL SEARCH BAR (overlaps hero bottom edge, matches mockup) ── */}
      <div className="relative z-30 px-6 -mt-8">
        <form
          onSubmit={handleSearch}
          className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl border border-[#eaddd5]/60 p-3 flex flex-col sm:flex-row items-stretch gap-2"
        >
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="Search by city or location"
            className="flex-1 input-pill !rounded-full"
          />
          <input
            type="text"
            value={hostelQuery}
            onChange={(e) => setHostelQuery(e.target.value)}
            placeholder="Search by hostel name"
            className="flex-1 input-pill !rounded-full"
          />
          <button type="submit" className="px-8 py-3 bg-[#e6472d] hover:bg-[#c73a22] text-white text-sm font-bold rounded-full shadow-sm transition-all shrink-0">
            Search
          </button>
        </form>
      </div>

      {/* ── INTRO STRIP (headline + CTAs, now below the slider instead of overlaid on it) ── */}
      <section className="bg-white px-6 pt-10 pb-14 sm:px-12 border-b border-[#eaddd5]/60">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-5">
         
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#2a1a12] leading-tight max-w-3xl">
            Find Your Perfect <span className="text-[#e6472d]">Student Home</span>
          </h1>
          <p className="text-[#6b5c54] text-base sm:text-lg max-w-xl leading-relaxed">
            Discover premium hostels, book your room instantly, and manage everything in one place.
          </p>
          <div className="flex items-center gap-4 mt-2 flex-wrap justify-center">
            <Link to="/register" state={authLinkState} className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#e6472d] hover:bg-[#c73a22] text-white font-bold rounded-full shadow-lg transition-all text-sm">
              Get Started <ArrowRight size={16} />
            </Link>
            <a href="#hostels" className="px-7 py-3.5 bg-[#FFA500] hover:bg-[#c73a22] border border-[#f3b8a3]/30 text-white font-bold rounded-full transition-all text-sm">
              Explore Hostels
            </a>
          </div>
        </div>
      </section>

      {/* ── HOSTELS SECTION (dynamic) ── */}
      <section id="hostels" className="px-6 py-20 sm:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            
            <h2 className="text-3xl font-extrabold text-[#2a1a12]">Available Hostels</h2>
            
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader /></div>
          ) : hostels.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[#eaddd5] rounded-2xl text-[#9c8b83] text-sm">
              No hostels are available yet. Check back soon!
            </div>
          ) : filteredHostels.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[#eaddd5] rounded-2xl text-[#9c8b83] text-sm flex flex-col items-center gap-3">
              <span>No hostels match "{cityQuery || hostelQuery}". Try a different search.</span>
              <button
                onClick={() => { setCityQuery(''); setHostelQuery(''); }}
                className="px-4 py-2 bg-[#fdece6] hover:bg-[#fbe0d6] text-[#e6472d] text-xs font-bold rounded-full transition-all"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredHostels.map((hostel) => (
                <div
                  key={hostel._id}
                  className="bg-white border border-[#eaddd5]/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
                >
                  {/* image */}
                  <div className="relative aspect-[16/10] bg-[#fdece6] overflow-hidden">
                    {hostel.images?.length > 0 ? (
                      <img
                        src={hostel.images[0]}
                        alt={hostel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building size={40} className="text-[#eaddd5]" />
                      </div>
                    )}
                    {hostel.city && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/95 text-[#e6472d] text-[10px] font-bold rounded-lg shadow-sm">
                        {hostel.city}
                      </span>
                    )}
                  </div>

                  {/* info */}
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <h3 className="font-bold text-[#2a1a12] text-base truncate">{hostel.name}</h3>

                    {hostel.address && (
                      <p className="text-xs text-[#9c8b83] flex items-start gap-1.5">
                        <MapPin size={12} className="mt-0.5 text-[#e6472d] shrink-0" />
                        {hostel.address}
                      </p>
                    )}

                    {hostel.description && (
                      <p className="text-xs text-[#6b5c54] line-clamp-2 leading-relaxed">{hostel.description}</p>
                    )}

                    {/* facilities */}
                    {hostel.facilities?.length > 0 && (
                      <p className="text-[11px] text-[#9c8b83] font-medium">
                        {hostel.facilities.slice(0, 3).join(' · ')}
                        {hostel.facilities.length > 3 && ` +${hostel.facilities.length - 3} more`}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#eaddd5]/60">
                      <button
                        onClick={() => setModal(hostel)}
                        className="px-3.5 py-2 bg-[#FFA500] hover:bg-[#c73a22] text-white text-[10px] font-bold rounded-full transition-colors"
                      >
                        Learn more →
                      </button>
                      <Link
                        to="/register" state={authLinkState}
                        className="px-3.5 py-2 bg-[#e6472d] hover:bg-[#c73a22] text-white text-[10px] font-bold rounded-full shadow-sm transition-all"
                      >
                        Apply Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ABOUT STRIP ── */}
      <section id="about" className="bg-[#e6472d] text-white px-6 py-16 sm:px-12">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl font-extrabold">Empowering Student Living</h2>
          <p className="text-white/75 text-sm leading-relaxed max-w-lg">
          CzHostel connects students with quality accommodations and gives hostel administrators powerful tools to manage bookings and complaints  all in one platform.
          </p>
        
          <Link to="/register" state={authLinkState} className="mt-2 inline-flex items-center gap-2 px-7 py-3 bg-white text-[#e6472d] font-bold rounded-full text-sm hover:bg-[#fdece6] transition-all shadow">
            Join Today <ArrowRight size={15} />
          </Link>
        </div>
      </section>


      
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="bg-white relative z-10 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* modal image */}
            <div className="relative aspect-[16/9] bg-[#fdece6] shrink-0">
              {modal.images?.length > 0 ? (
                <img src={modal.images[0]} alt={modal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Building size={48} className="text-[#eaddd5]" /></div>
              )}
              <button
                onClick={() => setModal(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm"
              >
                <X size={16} />
              </button>
            </div>

            {/* modal content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#2a1a12]">{modal.name}</h3>
                {modal.address && (
                  <p className="text-xs text-[#9c8b83] flex items-center gap-1.5 mt-1">
                    <MapPin size={12} className="text-[#e6472d]" /> {modal.address}{modal.city ? `, ${modal.city}` : ''}
                  </p>
                )}
              </div>

              {modal.description && (
                <p className="text-xs text-[#6b5c54] leading-relaxed">{modal.description}</p>
              )}

              {modal.facilities?.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold text-[#9c8b83] uppercase tracking-wider mb-2">Facilities</p>
                  <p className="text-xs text-[#6b5c54]">{modal.facilities.join(' · ')}</p>
                </div>
              )}

              {(modal.contactEmail || modal.contactPhone) && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-extrabold text-[#9c8b83] uppercase tracking-wider">Contact</p>
                  {modal.contactEmail && (
                    <span className="flex items-center gap-2 text-xs text-[#6b5c54]">
                      <Mail size={13} className="text-[#e6472d]" /> {modal.contactEmail}
                    </span>
                  )}
                  {modal.contactPhone && (
                    <span className="flex items-center gap-2 text-xs text-[#6b5c54]">
                      <Phone size={13} className="text-[#e6472d]" /> {modal.contactPhone}
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-2 pt-4 border-t border-[#eaddd5]/60">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 border border-[#eaddd5] text-[#6b5c54] text-xs font-bold rounded-full hover:bg-[#fdece6] transition-all"
                >
                  Close
                </button>
                <Link
                  to="/register" state={authLinkState}
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 bg-[#e6472d] hover:bg-[#c73a22] text-white text-xs font-bold rounded-full shadow transition-all text-center"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
