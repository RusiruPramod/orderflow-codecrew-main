import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Layers,
  Menu,
  Shield,
  Sparkles,
  Wrench,
  Zap,
  X,
  Sliders,
  Award,
  Clock,
  Check,
  PhoneCall,
  FileCheck,
  Microscope,
  Radio,
  HardDrive,
  Activity,
  UserCheck,
  ChevronDown
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Precision PCB Design & Manufacturing Services | CodeCrew" },
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

/* ─── Data Structures ─────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Services", href: "#services" },
  { label: "Showcase", href: "#showcase" },
  { label: "Interactive PCB", href: "#interactive" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Solutions", href: "#solutions" },
  { label: "Process", href: "#process" },
  { label: "Specs", href: "#specs" },
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
    title: "PCB Design",
    desc: "Complete end-to-end multi-layer printed circuit board design tailored to custom enclosure constraints and strict EMC compliance.",
  },
  {
    num: "02",
    icon: Layers,
    title: "PCB Layout",
    desc: "High-density interconnect (HDI) and high-speed signal integrity optimized board layout designs up to 32 layers.",
  },
  {
    num: "03",
    icon: Cpu,
    title: "Schematic Capture",
    desc: "Clean, robust electronic schematic diagrams with validated component symbol libraries and footprint mapping.",
  },
  {
    num: "04",
    icon: Zap,
    title: "PCB Prototyping",
    desc: "Rapid turnaround prototype fabrication and surface-mount technology (SMT) assembly for fast iteration cycles.",
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

const SHOWCASE_ITEMS = [
  {
    tag: "High-Speed Computing",
    title: "8-Layer DDR5 Motherboard Module",
    specs: "FR4 High-TG · 0.08mm Trace/Space · Controlled Impedance",
    colSpan: "lg:col-span-8",
    color: "from-orange-500/10 via-amber-500/5 to-transparent",
  },
  {
    tag: "RF / Microwave",
    title: "5.8 GHz Phased Antenna Array",
    specs: "Rogers RO4350B · Immersion Gold (ENIG)",
    colSpan: "lg:col-span-4",
    color: "from-blue-500/10 via-sky-500/5 to-transparent",
  },
  {
    tag: "IoT & Wearables",
    title: "Rigid-Flex Ultra-Miniature Sensor Node",
    specs: "4-Layer Polyimide Flex + FR4 · 0.4mm Pitch BGA",
    colSpan: "lg:col-span-4",
    color: "from-emerald-500/10 via-teal-500/5 to-transparent",
  },
  {
    tag: "Industrial Power",
    title: "100A Dual MOSFET Power Distribution",
    specs: "Heavy Copper 4oz · Aluminum Substrate Thermal Core",
    colSpan: "lg:col-span-8",
    color: "from-purple-500/10 via-indigo-500/5 to-transparent",
  },
];

const INTERACTIVE_HOTSPOTS = [
  {
    id: "processor",
    x: 45,
    y: 38,
    name: "Main Microprocessor (MCU)",
    chip: "STM32H7 High-Performance ARM Cortex-M7",
    details: "32-bit RISC core running at 480 MHz with 2MB Dual-Bank Flash. Features hardware DSP and double-precision FPU for complex real-time filtering.",
  },
  {
    id: "power",
    x: 22,
    y: 65,
    name: "Power Management IC (PMIC)",
    chip: "Synchronous Step-Down DC-DC Regulator",
    details: "High-efficiency 95% power switching block converting 12V-24V input down to 3.3V, 1.8V, and 1.2V core rails with minimal ripple voltage.",
  },
  {
    id: "memory",
    x: 72,
    y: 34,
    name: "High-Speed Memory Bus",
    chip: "1Gb QSPI NOR Flash & LPDDR4 Interface",
    details: "Length-matched serpentine traces with impedance matching (50Ω single-ended, 100Ω differential pairs) for noise-free burst transfers.",
  },
  {
    id: "connectivity",
    x: 80,
    y: 70,
    name: "Wireless Transceiver & Antenna",
    chip: "Wi-Fi 6 + Bluetooth 5.3 SoC Module",
    details: "Integrated 2.4/5GHz U.FL RF connector with 50Ω impedance coplanar waveguide and pi-matching LC network for maximum range.",
  },
  {
    id: "sensors",
    x: 30,
    y: 25,
    name: "Precision Analog Sensor Front-End",
    chip: "6-Axis MEMS Accelerometer & Gyroscope",
    details: "Isolated ground plane cutouts with low-noise low-dropout regulator (LDO) supply lines for micro-g measurement accuracy.",
  },
];

const CAPABILITIES = [
  {
    title: "High-Speed & HDI Layout",
    desc: "Routing blind/buried vias, microvias, pin-swapping BGA packages with 0.35mm pitch constraints.",
  },
  {
    title: "Impedance Control & SI",
    desc: "Controlled impedance differential pairs (USB, PCIe, HDMI, Ethernet) with 2D field solver modeling.",
  },
  {
    title: "Thermal & PDN Analysis",
    desc: "Thermal relief design, copper pour heat-sinking, and decoupling capacitor placement optimization.",
  },
  {
    title: "Rigid-Flex Board Engineering",
    desc: "Dynamic flexing zones, stiffener placement, and 3D folding clearance collision checking.",
  },
  {
    title: "IPC-6012 Class 3 Compliance",
    desc: "Designs pre-validated against rigorous military, medical, and aerospace reliability standards.",
  },
];

const SOLUTIONS = [
  { icon: Cpu, title: "Consumer Electronics", desc: "Smart home appliances, audio equipment, handheld gadgets." },
  { icon: Wrench, title: "Industrial Automation", desc: "PLC controllers, motor drivers, sensor arrays, heavy machinery." },
  { icon: Radio, title: "IoT & Wireless Nodes", desc: "Low-power BLE, LoRa, cellular tracking devices, edge gateways." },
  { icon: Shield, title: "Automotive Systems", desc: "CAN bus controllers, BMS battery monitors, EV charger units." },
  { icon: HardDrive, title: "Embedded Computing", desc: "Single board computers, SOM carrier boards, FPGA hardware." },
  { icon: Microscope, title: "Medical Electronics", desc: "Patient telemetry, diagnostic gear, bio-signal monitoring." },
];

const PROCESS_STEPS = [
  { step: "01", title: "Discover & Requirements", desc: "We review your schematic, component list, enclosure CAD, and target specs." },
  { step: "02", title: "Schematic & Stackup", desc: "Creating the component footprint library and establishing layer stackups." },
  { step: "03", title: "Layout & Routing", desc: "Precision manual routing of critical power lines, high-speed busses, and signals." },
  { step: "04", title: "DFM & DRC Review", desc: "Executing automated Design Rule Checks and manual assembly review." },
  { step: "05", title: "Rapid Prototype", desc: "Fabricating test boards with fast turn times for functional verification." },
  { step: "06", title: "Production Handover", desc: "Delivering complete Gerber RS-274X, IPC-2581, BOM, and Pick & Place files." },
];

const TESTIMONIALS = [
  {
    quote: "CodeCrew transformed our complex 6-layer IoT Gateway schematic into a production-ready PCB in under a week. Zero DRC errors on first fab run!",
    author: "Dr. Marcus Vance",
    role: "VP of Hardware, X-Tech Sensors",
  },
  {
    quote: "The attention to signal integrity and impedance matching on our DDR4 memory layout was outstanding. They are our go-to PCB design partner.",
    author: "Sarah Jenkins",
    role: "Lead Electronics Engineer, Robotics Lab",
  },
  {
    quote: "Exceptional quality, fast communication, and pristine Gerber packages. Ordering through their portal makes manufacturing seamless.",
    author: "Kavinda Perera",
    role: "Founder, AutomaTech Solutions",
  },
];

/* ─── Main Component ──────────────────────────────────────────────────── */

function PublicPcbWebsite() {
  const navigate = useNavigate();

  // Scroll Progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolledNav, setScrolledNav] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string>("processor");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Counter State
  const [counters, setCounters] = useState(METRICS.map(() => 0));
  const countersAnimated = useRef(false);

  // Initial Loader Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingComplete(true);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll listener for progress & navbar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
      setScrolledNav(window.scrollY > 40);

      // Trigger metric counters when scrolled to metrics section
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

  // Before / After Slider Drag
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const selectedHotspotData = INTERACTIVE_HOTSPOTS.find((h) => h.id === activeHotspot) || INTERACTIVE_HOTSPOTS[0];

  return (
    <div className="relative min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      {/* ─── 00. Short Professional Loading Animation ───────────────────── */}
      <AnimatePresence>
        {!loadingComplete && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white"
          >
            <div className="relative flex items-center justify-center mb-6">
              <svg className="size-20" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="45" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                <path
                  d="M 20,50 L 40,50 L 50,25 L 60,75 L 70,50 L 80,50"
                  stroke="#FF6B00"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 300,
                    animation: "loading-trace 1.2s ease-in-out forwards",
                  }}
                />
              </svg>
              <div className="absolute size-3 rounded-full bg-orange-500 animate-ping" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-wider text-white">CODECREW</span>
              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">PCB LABS</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono animate-pulse">INITIALIZING HARDWARE ENGINE...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 01. Scroll Progress Bar ───────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 z-[90] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ─── 02. Navigation Bar ────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-[80] transition-all duration-300 ${
          scrolledNav
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2">
            <Logo />
          </a>

          {/* Desktop Navigation */}
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

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-orange-600 px-4 py-2 rounded-xl transition-colors"
            >
              Login
            </Link>
            <Link
              to="/customer-order"
              className="group inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-orange-500/25 transition-all duration-200"
            >
              <span>Start Your Order</span>
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Toggle Navigation"
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
                  className="w-full text-center bg-orange-600 text-white font-semibold py-3 rounded-xl shadow-md"
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
      <section id="hero" className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden dot-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white pointer-events-none" />

        {/* Ambient Orange Glow Blob */}
        <div className="absolute top-1/4 right-10 size-96 rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-200/60 mb-6"
              >
                <Sparkles className="size-3.5 text-orange-600" />
                <span>Next-Gen Electronics Manufacturing</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-slate-950 leading-[1.08]"
              >
                Engineering the <br className="hidden sm:inline" />
                Future of <span className="text-gradient-brand">PCB Design</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl"
              >
                From concept schematic and multi-layer layout to production-ready boards, we transform electronic hardware ideas into precision-engineered solutions.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              >
                <Link
                  to="/customer-order"
                  className="group inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base px-8 py-4 rounded-xl shadow-lg shadow-orange-600/20 transition-all duration-200"
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

              {/* Technical Features Pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-500"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-orange-500" /> Up to 32 Layers
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-orange-500" /> IPC-6012 Class 3
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-orange-500" /> 24h Turnaround Available
                </span>
              </motion.div>
            </div>

            {/* Right Interactive PCB SVG Visual */}
            <div className="lg:col-span-5 relative flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full max-w-md pcb-float"
              >
                <div className="relative rounded-3xl bg-slate-950 p-6 shadow-2xl border border-slate-800 overflow-hidden">
                  {/* Grid Lines on dark PCB */}
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {/* PCB Graphic Artwork */}
                  <svg className="w-full h-auto relative z-10" viewBox="0 0 400 400" fill="none">
                    {/* Outer board outline */}
                    <rect x="20" y="20" width="360" height="360" rx="24" fill="#090d16" stroke="#1e293b" strokeWidth="3" />

                    {/* Corner Mounting Holes */}
                    <circle cx="50" cy="50" r="12" fill="#0f172a" stroke="#475569" strokeWidth="3" />
                    <circle cx="350" cy="50" r="12" fill="#0f172a" stroke="#475569" strokeWidth="3" />
                    <circle cx="50" cy="350" r="12" fill="#0f172a" stroke="#475569" strokeWidth="3" />
                    <circle cx="350" cy="350" r="12" fill="#0f172a" stroke="#475569" strokeWidth="3" />

                    {/* Main BGA Processor Chip */}
                    <rect x="140" y="140" width="120" height="120" rx="10" fill="#1e293b" stroke="#FF6B00" strokeWidth="2" />
                    <rect x="155" y="155" width="90" height="90" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x="200" y="205" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="bold" fontFamily="sans-serif">CODECREW</text>
                    <text x="200" y="222" textAnchor="middle" fill="#FF6B00" fontSize="9" fontFamily="monospace">CORE-PCB v3.2</text>

                    {/* Circuit Traces (Animated) */}
                    <path d="M 50 140 L 140 140" stroke="#FF6B00" strokeWidth="2" strokeDasharray="6 6" />
                    <path d="M 260 160 L 350 160" stroke="#FF6B00" strokeWidth="2" />
                    <path d="M 200 260 L 200 350" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M 140 220 L 50 220 M 50 220 L 50 290 L 120 290" stroke="#FF6B00" strokeWidth="2" />

                    {/* Diagonal traces */}
                    <path d="M 260 240 L 310 290 L 350 290" stroke="#10b981" strokeWidth="2" />
                    <path d="M 140 180 L 90 130 L 50 130" stroke="#FF6B00" strokeWidth="2" />

                    {/* Component Capacitors & Resistors */}
                    <rect x="70" y="70" width="20" height="40" rx="3" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
                    <rect x="100" y="70" width="20" height="40" rx="3" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
                    <rect x="290" y="70" width="40" height="20" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                    <rect x="290" y="200" width="40" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />

                    {/* Glowing Trace Pulse Node */}
                    <circle cx="260" cy="160" r="5" fill="#FF6B00" className="animate-pulse" />
                    <circle cx="140" cy="140" r="5" fill="#FF6B00" className="animate-pulse" />
                    <circle cx="310" cy="290" r="4" fill="#10b981" />
                  </svg>

                  {/* Floating Overlay Badge */}
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-slate-300 font-mono">Status: Routing Verified</span>
                    </div>
                    <span className="text-orange-400 font-mono">DRC: PASS</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 04. TRUST / COMPANY METRICS ───────────────────────────────── */}
      <section id="metrics" className="py-14 bg-slate-950 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {METRICS.map((m, idx) => (
              <div key={m.label} className="p-4">
                <div className="text-4xl sm:text-5xl font-extrabold font-display text-orange-500 tracking-tight">
                  {counters[idx]}
                  {m.suffix}
                </div>
                <div className="mt-2 text-sm text-slate-400 font-medium">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 05. SERVICES SECTION ──────────────────────────────────────── */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">01 / OUR SERVICES</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-slate-950">
              Everything You Need to Build Better Electronics
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              End-to-end hardware engineering services designed for rapid product deployment and flawless manufacturing output.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="group relative bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="grid size-12 place-items-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                      <Icon className="size-6" />
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-orange-600 transition-colors">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900 group-hover:text-orange-600 transition-colors">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Learn More</span>
                    <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 06. PCB DESIGN SHOWCASE ────────────────────────────────────── */}
      <section id="showcase" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">02 / PORTFOLIO</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold font-display text-slate-950">
                Engineered With Precision
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Explore recent hardware projects designed for industrial aerospace, IoT medical hardware, and high-speed embedded computing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {SHOWCASE_ITEMS.map((item) => (
              <div
                key={item.title}
                className={`${item.colSpan} group relative rounded-3xl bg-white border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[300px]`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-50 group-hover:opacity-100 transition-opacity`} />

                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold mb-4">
                    {item.tag}
                  </span>
                  <h3 className="text-2xl font-bold font-display text-slate-900 group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs font-mono text-slate-500">
                    {item.specs}
                  </p>
                </div>

                <div className="relative z-10 mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Production Verified</span>
                  <span className="grid size-8 place-items-center rounded-full bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 07. INTERACTIVE PCB DIAGRAM SECTION ──────────────────────── */}
      <section id="interactive" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">03 / INTERACTIVE EXPLORER</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold font-display text-slate-950">
              Anatomy of a High-Performance PCB
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Click or hover on key circuit hotspots below to inspect component routing, layer stackups, and signal integrity specs.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Interactive SVG Board Canvas */}
            <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 shadow-xl border border-slate-800 relative min-h-[400px] flex items-center justify-center">
              <svg className="w-full h-auto" viewBox="0 0 500 350" fill="none">
                <rect x="10" y="10" width="480" height="330" rx="20" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
                {/* Traces */}
                <path d="M 60 70 L 220 70 L 220 160" stroke="#FF6B00" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 220 160 L 360 160 L 360 90" stroke="#38bdf8" strokeWidth="2" />
                <path d="M 220 160 L 120 220 L 120 265" stroke="#10b981" strokeWidth="2" />
                <path d="M 220 160 L 400 245" stroke="#f59e0b" strokeWidth="2" />

                {/* Hotspot Nodes */}
                {INTERACTIVE_HOTSPOTS.map((h) => {
                  const isActive = activeHotspot === h.id;
                  const cx = (h.x / 100) * 500;
                  const cy = (h.y / 100) * 350;
                  return (
                    <g key={h.id} className="cursor-pointer" onClick={() => setActiveHotspot(h.id)}>
                      <circle cx={cx} cy={cy} r={isActive ? "14" : "10"} fill={isActive ? "#FF6B00" : "#334155"} opacity={0.3} className="animate-ping" />
                      <circle cx={cx} cy={cy} r="8" fill={isActive ? "#FF6B00" : "#0f172a"} stroke={isActive ? "#ffffff" : "#FF6B00"} strokeWidth="2" />
                      <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hotspot Details Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-mono text-orange-400 uppercase mb-2">
                  <Activity className="size-4 text-orange-500" /> Selected Subsystem
                </div>
                <h3 className="text-2xl font-bold font-display text-white">
                  {selectedHotspotData.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-orange-400">
                  {selectedHotspotData.chip}
                </p>
                <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                  {selectedHotspotData.details}
                </p>

                <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">Impedance: 50Ω ±5%</span>
                  <Link
                    to="/customer-order"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300"
                  >
                    <span>Request Similar Spec</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              {/* Selector Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {INTERACTIVE_HOTSPOTS.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setActiveHotspot(h.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeHotspot === h.id
                        ? "bg-orange-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {h.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 08. CAPABILITIES SECTION ──────────────────────────────────── */}
      <section id="capabilities" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">04 / CORE CAPABILITIES</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold font-display">
              Advanced Engineering Capabilities
            </h2>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {CAPABILITIES.map((cap, i) => (
              <div key={cap.title} className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 hover:border-orange-500 transition-colors">
                <span className="text-xs font-mono text-orange-400 font-bold">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold text-white">{cap.title}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 09. INDUSTRIES / SOLUTIONS ────────────────────────────────── */}
      <section id="solutions" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">05 / INDUSTRIES</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold font-display text-slate-950">
              Solutions Across Hardware Domains
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {SOLUTIONS.map((sol) => {
              const Icon = sol.icon;
              return (
                <div key={sol.title} className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-orange-200 hover:shadow-md transition-all">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{sol.title}</h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{sol.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 10. ENGINEERING PROCESS TIMELINE ──────────────────────────── */}
      <section id="process" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">06 / PROCESS</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold font-display text-slate-950">
              Our 6-Step Engineering Workflow
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PROCESS_STEPS.map((ps) => (
              <div key={ps.step} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative">
                <span className="text-3xl font-extrabold font-mono text-orange-500/20">{ps.step}</span>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{ps.title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{ps.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 11. TECHNICAL SPECIFICATION (DARK SECTION) ────────────────── */}
      <section id="specs" className="py-24 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">07 / PRECISION SPECS</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold font-display">
                Industrial Manufacturing Tolerances
              </h2>
              <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                Every board produced through our system undergoes strict multi-point optical inspection, automated X-ray analysis, and flying probe testing.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { label: "Layer Count", val: "1 to 32 Layers" },
                  { label: "Minimum Trace / Space", val: "0.075mm / 3 mil" },
                  { label: "Minimum Hole Size", val: "0.15mm (Laser Microvia)" },
                  { label: "Board Thickness", val: "0.4mm to 3.2mm" },
                  { label: "Surface Finishes", val: "ENIG (Gold), HASL, OSP, Immersion Silver" },
                ].map((spec) => (
                  <div key={spec.label} className="flex justify-between border-b border-slate-800 pb-2 text-xs">
                    <span className="text-slate-400">{spec.label}</span>
                    <span className="font-mono font-bold text-orange-400">{spec.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Before / After Interactive Component Comparison */}
            <div className="lg:col-span-6">
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                  <span>Interactive Concept vs Production Slider</span>
                  <span className="text-xs font-mono text-orange-400">{Math.round(sliderPosition)}% Revealed</span>
                </h3>

                <div
                  ref={sliderRef}
                  onMouseDown={(e) => handleSliderMove(e.clientX)}
                  onMouseMove={(e) => {
                    if (e.buttons === 1) handleSliderMove(e.clientX);
                  }}
                  onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
                  className="ba-slider relative h-64 bg-slate-950 rounded-2xl overflow-hidden cursor-ew-resize border border-slate-800"
                >
                  {/* Before Side (Unrouted) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
                    <CircuitBoard className="size-16 text-slate-700 mb-2" />
                    <span className="text-xs font-mono text-slate-500 uppercase">Initial Concept Schematic</span>
                    <span className="text-[11px] text-slate-600 mt-1">Unrouted nets & unverified footprints</span>
                  </div>

                  {/* After Side (Routed 8-Layer) */}
                  <div
                    className="absolute inset-y-0 left-0 bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-6 text-center border-r-2 border-orange-500"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <div className="w-[300px] flex flex-col items-center justify-center">
                      <Cpu className="size-16 text-orange-500 mb-2" />
                      <span className="text-xs font-mono text-orange-400 uppercase font-bold">Production-Ready 8-Layer PCB</span>
                      <span className="text-[11px] text-slate-300 mt-1">Impedance matched & 3D enclosure checked</span>
                    </div>
                  </div>

                  {/* Draggable Handle */}
                  <div
                    className="ba-slider-handle"
                    style={{ left: `${sliderPosition}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 12. TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">08 / TESTIMONIALS</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold font-display text-slate-950">
              Trusted by Hardware Innovators
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <p className="text-sm text-slate-700 leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="font-bold text-sm text-slate-900">{t.author}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 13. CTA SECTION ───────────────────────────────────────────── */}
      <section className="py-20 bg-orange-600 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight">
            Have a PCB Idea? Let's Build It.
          </h2>
          <p className="mt-4 text-orange-100 text-lg max-w-xl mx-auto">
            Submit your Gerber files or schematic requirements and get a instant quotation from our engineering team.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/customer-order"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold text-base px-9 py-4 rounded-xl shadow-xl transition-all"
            >
              <span>Start Your Order</span>
              <ArrowRight className="size-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-base px-8 py-4 rounded-xl backdrop-blur transition-all"
            >
              System Login
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 14. FOOTER ────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 text-slate-400 max-w-xs leading-relaxed">
              CodeCrew PCB ERP & Engineering Services. Precision printed circuit board design, prototyping, and end-to-end production workflow.
            </p>
          </div>

          <div>
            <div className="font-bold text-white uppercase text-xs tracking-wider mb-4">Company</div>
            <ul className="space-y-2.5">
              <li><a href="#hero" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#showcase" className="hover:text-white transition-colors">Projects</a></li>
              <li><a href="#process" className="hover:text-white transition-colors">Process</a></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white uppercase text-xs tracking-wider mb-4">Services</div>
            <ul className="space-y-2.5">
              <li><a href="#services" className="hover:text-white transition-colors">PCB Design</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">PCB Layout</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Prototyping</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Manufacturing</a></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white uppercase text-xs tracking-wider mb-4">Portals</div>
            <ul className="space-y-2.5">
              <li><Link to="/customer-order" className="text-orange-400 hover:underline">Submit Order</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Owner & Designer Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} CodeCrew PCB Services. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
