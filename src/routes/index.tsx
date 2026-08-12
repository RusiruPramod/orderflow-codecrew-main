import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Layers,
  Menu,
  Sparkles,
  Wrench,
  Zap,
  X,
  Activity,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Pcb3dStackup } from "@/components/pcb-3d-stackup";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Precision PCB Design & Engineering Services | CodeCrew" },
      {
        name: "description",
        content:
          "World-class PCB engineering, high-speed layout design, schematic development, and rapid prototyping services.",
      },
      { property: "og:title", content: "CodeCrew PCB — Engineering the Future of Electronics" },
      {
        property: "og:description",
        content: "Turn your hardware ideas into precision-engineered production PCBs.",
      },
    ],
  }),
  component: PublicPcbWebsite,
});

/* ─── Navigation Links ────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#solutions" },
  { label: "Projects", href: "#real-gallery" },
  { label: "3D Stackup", href: "#stackup-3d" },
  { label: "About", href: "#precision" },
  { label: "Contact", href: "#contact" },
];

const METRICS = [
  { value: 10, suffix: "+", label: "Years Experience" },
  { value: 500, suffix: "+", label: "PCB Designs Delivered" },
  { value: 200, suffix: "+", label: "Completed Projects" },
  { value: 98, suffix: "%", label: "Customer Satisfaction" },
];

const SERVICES = [
  {
    num: "01",
    icon: CircuitBoard,
    title: "PCB Design & Gerber Generation",
    desc: "Complete multi-layer printed circuit board design tailored to custom enclosure constraints and strict EMC compliance.",
  },
  {
    num: "02",
    icon: Layers,
    title: "High-Density PCB Layout",
    desc: "High-density interconnect (HDI) and high-speed signal integrity optimized board layout designs up to 32 layers.",
  },
  {
    num: "03",
    icon: Cpu,
    title: "Schematic Capture & Symbol DB",
    desc: "Clean, robust electronic schematic diagrams with validated component symbol libraries and footprint mapping.",
  },
  {
    num: "04",
    icon: Zap,
    title: "Copper Clad & Prototyping",
    desc: "Single & double-sided FR4 copper clad prototyping, fast chemical etching, and surface-mount assembly.",
  },
  {
    num: "05",
    icon: Wrench,
    title: "DFM & Manufacturing",
    desc: "Design for Manufacturability (DFM) verification ensuring seamless high-volume production with maximum yields.",
  },
  {
    num: "06",
    icon: Activity,
    title: "Design Optimization",
    desc: "Thermal dissipation, impedance matching, power delivery network (PDN) tuning, and signal integrity refactoring.",
  },
];

const REAL_GALLERY = [
  {
    img: "/images/pcb-copper-clad.png",
    tag: "Substrate",
    title: "FR4 Double-Sided Copper Clad Boards",
    desc: "Ultra-pure 1oz/2oz electro-deposited copper laminate on glass-reinforced epoxy substrate.",
    badge: "1.6mm FR4",
  },
  {
    img: "/images/pcb-gerber-red.png",
    tag: "Gerber Layout",
    title: "Precision Trace Routing Paths",
    desc: "Custom high-speed signal routing with yellow silkscreen pin identification and micro-vias.",
    badge: "0.075mm Trace",
  },
  {
    img: "/images/pcb-workstation.png",
    tag: "Workstation",
    title: "Schematic & IC Assembly Lab",
    desc: "Hardware validation lab featuring QFP chip mounting and physical schematic review.",
    badge: "IPC Class 3",
  },
  {
    img: "/images/pcb-multi-layer-cad.png",
    tag: "3D CAD",
    title: "Integrated Multi-Layer 3D Modeling",
    desc: "Real-time 3D clearance collision detection and Gerber drill file generation.",
    badge: "3D Step Export",
  },
];

const STACKUP_LAYERS = [
  { num: 1, name: "TOP LAYER (SIGNAL)", desc: "High-speed differential pairs, RF microstrip traces, and SMT component pads.", color: "border-emerald-500 bg-emerald-500/10 text-emerald-700" },
  { num: 2, name: "LAYER 2 (GND PLANE)", desc: "Solid copper reference ground plane providing return paths & EMI shielding.", color: "border-sky-500 bg-sky-500/10 text-sky-700" },
  { num: 3, name: "LAYER 3 (POWER PLANE)", desc: "Low-impedance power distribution pour for stable rail voltages.", color: "border-orange-500 bg-orange-500/10 text-orange-700" },
  { num: 4, name: "BOTTOM LAYER (SIGNAL)", desc: "Secondary signal routing, power jumpers, and bottom surface test points.", color: "border-purple-500 bg-purple-500/10 text-purple-700" },
];

const PROCESS_STEPS = [
  { step: "01", title: "Discover & Requirements", desc: "We review your schematic, component list, enclosure CAD, and target specs." },
  { step: "02", title: "Schematic & Stackup", desc: "Creating component symbol footprint libraries and establishing layer stackups." },
  { step: "03", title: "Layout & Routing", desc: "Precision manual routing of critical power lines, high-speed busses, and signals." },
  { step: "04", title: "DFM & DRC Review", desc: "Executing automated Design Rule Checks and manual assembly review." },
  { step: "05", title: "Copper Clad Prototyping", desc: "Fabricating prototype boards with fast turn times for functional verification." },
  { step: "06", title: "Production Handover", desc: "Delivering complete Gerber RS-274X, IPC-2581, BOM, and Pick & Place files." },
];

/* ─── Main Component ──────────────────────────────────────────────────── */

function PublicPcbWebsite() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolledNav, setScrolledNav] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(48);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const [counters, setCounters] = useState(METRICS.map(() => 0));
  const countersAnimated = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoadingComplete(true), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
      setScrolledNav(window.scrollY > 30);

      const metricsEl = document.getElementById("metrics");
      if (metricsEl && !countersAnimated.current) {
        const rect = metricsEl.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
          countersAnimated.current = true;
          METRICS.forEach((m, idx) => {
            let start = 0;
            const end = m.value;
            const duration = 1500;
            const stepTime = 30;
            const steps = duration / stepTime;
            const increment = end / steps;

            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                setCounters((prev) => {
                  const copy = [...prev];
                  copy[idx] = end;
                  return copy;
                });
                clearInterval(timer);
              } else {
                setCounters((prev) => {
                  const copy = [...prev];
                  copy[idx] = Math.floor(start);
                  return copy;
                });
              }
            }, stepTime);
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sliderRef = useRef<HTMLDivElement>(null);
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  return (
    <div className="relative min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      {/* Loading Overlay */}
      <AnimatePresence>
        {!loadingComplete && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white"
          >
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl text-white">CODECREW</span>
              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">PCB LABS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 z-[90] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ─── 02. Navbar ─────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-300 ${
          scrolledNav
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2 shrink-0">
            <Logo />
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-orange-600 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-orange-600 px-3 py-2 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/customer-order"
              className="group inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-md hover:shadow-orange-500/25 transition-all duration-200"
            >
              <span>Start Your Order</span>
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[65px] z-[75] bg-white border-b border-slate-200 p-6 shadow-2xl lg:hidden"
          >
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-800 hover:text-orange-600 py-1"
                >
                  {link.label}
                </a>
              ))}
              <hr className="my-2 border-slate-100" />
              <div className="flex flex-col gap-3">
                <Link
                  to="/customer-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-orange-600 text-white font-semibold py-3 rounded-full shadow-md"
                >
                  Start Your Order
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center border border-slate-300 font-semibold py-3 rounded-xl text-slate-800"
                >
                  System Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 03. HERO SECTION ──────────────────────────────────────────── */}
      <section id="hero" className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-200/60 mb-6"
              >
                <Sparkles className="size-3.5 text-orange-600" />
                <span>Next-Gen PCB Design & Fabrication</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-slate-950 leading-[1.08]"
              >
                Engineering the <br className="hidden sm:inline" />
                Future of <span className="text-gradient-brand">PCB Design</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl"
              >
                From concept and PCB layout to production-ready boards, we transform electronic hardware ideas into precision-engineered solutions.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              >
                <Link
                  to="/customer-order"
                  className="group inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base px-8 py-4 rounded-full shadow-lg shadow-orange-600/20 transition-all duration-200"
                >
                  <span>Start Your Order</span>
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base px-7 py-4 rounded-xl border border-slate-300 shadow-sm transition-colors"
                >
                  Explore Services
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-500"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-orange-500" /> FR4 Copper Clad Support
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-orange-500" /> Up to 32 Layers
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-orange-500" /> IPC-6012 Class 3
                </span>
              </motion.div>
            </div>

            <div className="lg:col-span-6 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white p-2"
              >
                <div className="relative rounded-xl overflow-hidden h-64 sm:h-80">
                  <img
                    src="/images/black-orange-pcb.png"
                    alt="Precision Engineering PCB"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-800 text-xs">
                    <div>
                      <div className="font-bold text-orange-400">Precision Lab Workstation</div>
                      <div className="text-slate-300 text-[11px]">Schematic blueprint & QFP CPU chip review</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-mono font-bold text-[10px]">
                      IPC CLASS 3
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 04. METRICS STRIP ─────────────────────────────────────────── */}
      <section id="metrics" className="py-12 bg-slate-950 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {METRICS.map((m, idx) => (
              <div key={m.label} className="p-2">
                <div className="text-3xl sm:text-4xl font-extrabold font-display text-orange-500 tracking-tight">
                  {counters[idx]}
                  {m.suffix}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 05. THREE.JS 3D MULTI-LAYER STACKUP SECTION ────────────────── */}
      <section id="stackup-3d" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">01 / THREE.JS 3D ANIMATION</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold font-display">
              Interactive 3D PCB Layer Stackup
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Drag the explosion slider below to separate the 4-layer PCB structure in 3D space. Click individual layers to inspect signal paths & copper weights.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <Pcb3dStackup />
            </div>

            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Layers className="size-4 text-orange-500" />
                <span>Layer Architecture</span>
              </h3>

              {STACKUP_LAYERS.map((layer) => (
                <div
                  key={layer.num}
                  className={`p-3 rounded-xl border ${layer.color} transition-all hover:translate-x-1`}
                >
                  <div className="flex items-center justify-between text-xs font-bold font-mono mb-1">
                    <span>{layer.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/20">L{layer.num}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">{layer.desc}</p>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  to="/customer-order"
                  className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-3 rounded-full shadow-md transition-colors"
                >
                  <span>Order Custom Layer Stackup</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 06. CROPPED HARDWARE GALLERY ──────────────────────────────── */}
      <section id="real-gallery" className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">02 / HARDWARE GALLERY</span>
            <h2 className="mt-2 text-3xl font-extrabold font-display text-slate-950">
              Raw Copper Clad Boards & Gerber Layouts
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Cropped high-resolution showcase of raw FR4 copper clad laminates, Gerber trace paths, and 3D CAD modeling.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REAL_GALLERY.map((item) => (
              <div
                key={item.title}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur text-white text-[10px] font-semibold">
                      {item.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-600 text-white font-mono text-[10px] font-bold">
                      {item.badge}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold font-display text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600">
                    <span>Specs</span>
                    <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 07. SERVICES SECTION ──────────────────────────────────────── */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">03 / OUR SERVICES</span>
            <h2 className="mt-2 text-3xl font-extrabold font-display text-slate-950">
              Everything You Need to Build Better Electronics
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-orange-500/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-orange-600 transition-colors">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-display text-slate-900 group-hover:text-orange-600 transition-colors">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 08. FROM CONCEPT TO PRODUCTION-READY (BEFORE/AFTER SLIDER) ─ */}
      <section id="transformation" className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">
                <span className="h-0.5 w-4 bg-orange-500 inline-block" /> 07 / TRANSFORMATION
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-950">
                From Concept to Production-Ready
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-xs">
              Drag the handle to compare an initial concept sketch with the released manufacturing-ready board.
            </p>
          </div>

          {/* Interactive Before/After Image Comparison Slider matching Screenshots 2, 3, 5 */}
          <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-200">
            <div
              ref={sliderRef}
              onMouseDown={(e) => handleSliderMove(e.clientX)}
              onMouseMove={(e) => {
                if (e.buttons === 1) handleSliderMove(e.clientX);
              }}
              onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
              className="ba-slider relative h-[360px] sm:h-[480px] bg-slate-900 rounded-2xl overflow-hidden cursor-ew-resize border border-slate-200 select-none"
            >
              {/* Left Side: Hand-Drawn Schematic Concept Sketch */}
              <div className="absolute inset-0 bg-white">
                <img
                  src="/images/concept-sketch.png"
                  alt="Initial Concept Schematic Sketch"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 text-white font-mono text-[11px] font-bold uppercase tracking-wider shadow-md">
                    INITIAL CONCEPT
                  </span>
                </div>
              </div>

              {/* Right Side: Black & Orange Production PCB */}
              <div
                className="absolute inset-y-0 left-0 bg-slate-950 overflow-hidden border-r-2 border-orange-500"
                style={{ width: `${sliderPosition}%` }}
              >
                <div className="w-[800px] sm:w-[1200px] h-full relative">
                  <img
                    src="/images/black-orange-pcb.png"
                    alt="Production-Ready PCB"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-white font-mono text-[11px] font-bold uppercase tracking-wider shadow-md">
                      PRODUCTION-READY PCB
                    </span>
                  </div>
                </div>
              </div>

              {/* Draggable Circular Orange Button */}
              <div
                className="ba-slider-handle"
                style={{ left: `${sliderPosition}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 09. PRECISION ENGINEERING (DARK SECTION - SCREENSHOT 1) ────── */}
      <section id="precision" className="py-24 bg-slate-950 text-white relative overflow-hidden">
        {/* Subtle Dark Background Grid with Orange Trace Graphics */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none">
            <path d="M 100,100 L 400,100 L 500,200 L 900,200" stroke="#FF6B00" strokeWidth="1.5" strokeDasharray="6 6" />
            <path d="M 200,400 L 600,400 L 700,300 L 1100,300" stroke="#FF6B00" strokeWidth="1.5" />
            <circle cx="400" cy="100" r="4" fill="#FF6B00" />
            <circle cx="500" cy="200" r="4" fill="#FF6B00" />
            <circle cx="600" cy="400" r="4" fill="#FF6B00" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-widest mb-3">
                <span className="h-0.5 w-4 bg-orange-500 inline-block" /> 09 / PRECISION
              </div>

              <h2 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
                Precision Engineering
              </h2>

              <p className="mt-4 text-base text-slate-300 leading-relaxed">
                Micron-level placement, verified impedance and simulation-backed routing. Every layer is engineered so the board performs exactly as designed — from first prototype to volume production.
              </p>

              {/* 4 Key Metrics */}
              <div className="mt-10 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-orange-500">0.075mm</div>
                  <div className="mt-1 text-xs text-slate-400 font-medium">Minimum trace width</div>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-orange-500">32</div>
                  <div className="mt-1 text-xs text-slate-400 font-medium">Maximum layers</div>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-orange-500">±5%</div>
                  <div className="mt-1 text-xs text-slate-400 font-medium">Impedance tolerance</div>
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-orange-500">24h</div>
                  <div className="mt-1 text-xs text-slate-400 font-medium">Design review turn</div>
                </div>
              </div>
            </div>

            {/* Right Side Black/Orange PCB Image Card (Matching Screenshot 1) */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 p-3">
                <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96">
                  <img
                    src="/images/black-orange-pcb.png"
                    alt="Precision Engineering PCB Board"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. CONTACT / CTA SECTION (MATCHING SCREENSHOT 4) ──────────── */}
      <section id="contact" className="py-24 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
        {/* Subtle Trace Background Grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none">
            <path d="M 50,300 L 300,300 L 450,150 L 800,150 L 950,350 L 1150,350" stroke="#FF6B00" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="4" fill="#FF6B00" />
            <circle cx="450" cy="150" r="4" fill="#FF6B00" />
            <circle cx="800" cy="150" r="4" fill="#FF6B00" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-widest mb-4">
            <span className="h-0.5 w-4 bg-orange-500 inline-block" /> 11 / CONTACT
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
            Have a PCB Idea?<br />
            <span className="text-orange-500">Let's Build It.</span>
          </h2>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/customer-order"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base px-9 py-4 rounded-full shadow-xl shadow-orange-600/30 transition-all"
            >
              <span>Start Your Order</span>
              <ArrowRight className="size-5" />
            </Link>
            <a
              href="mailto:engineering@codecrew.dev"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-base px-8 py-4 rounded-xl border border-slate-800 transition-all"
            >
              Talk to an Expert
            </a>
          </div>

          {/* Footer Info Strip (Matching Screenshot 4) */}
          <div className="mt-20 pt-8 border-t border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs font-mono">
            <div>
              <div className="text-slate-500 uppercase tracking-wider mb-1">EMAIL</div>
              <a href="mailto:engineering@codecrew.dev" className="text-slate-200 hover:text-orange-400 text-sm font-semibold transition-colors">
                engineering@codecrew.dev
              </a>
            </div>

            <div>
              <div className="text-slate-500 uppercase tracking-wider mb-1">RESPONSE TIME</div>
              <div className="text-slate-200 text-sm font-semibold">
                Within one business day
              </div>
            </div>

            <div>
              <div className="text-slate-500 uppercase tracking-wider mb-1">ENGAGEMENT</div>
              <div className="text-slate-200 text-sm font-semibold">
                Project, retainer or fixed scope
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. FOOTER ────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-slate-500">| Precision PCB Engineering ERP</span>
          </div>

          <div>© {new Date().getFullYear()} CodeCrew PCB Services. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
