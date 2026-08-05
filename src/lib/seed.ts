import type { ActivityLog, AppUser, Expense, Notification, Order } from "./types";

const now = Date.now();
const day = 86_400_000;
const iso = (offsetDays: number) => new Date(now - offsetDays * day).toISOString();

export const seedUsers: AppUser[] = [
  {
    id: "u-owner",
    name: "Nuwan Perera",
    email: "owner@codecrew.dev",
    role: "owner",
    active: true,
    joinedAt: iso(420),
    specialty: "Founder / Operations",
  },
  {
    id: "u-des-1",
    name: "Ishara Fernando",
    email: "designer@codecrew.dev",
    role: "designer",
    active: true,
    joinedAt: iso(210),
    specialty: "High-speed 4–8 layer routing",
    phone: "+94 77 555 1201",
  },
  {
    id: "u-des-2",
    name: "Marek Nowak",
    email: "marek@codecrew.dev",
    role: "designer",
    active: true,
    joinedAt: iso(150),
    specialty: "RF & antenna layout",
  },
  {
    id: "u-des-3",
    name: "Priya Raman",
    email: "priya@codecrew.dev",
    role: "designer",
    active: false,
    joinedAt: iso(90),
    specialty: "Power electronics",
  },
];

function files(prefix: string) {
  return [
    { id: `${prefix}-f1`, name: "gerber-rev-c.zip", kind: "Gerber" as const, size: 842_100, uploadedAt: iso(9) },
    { id: `${prefix}-f2`, name: "project.easyeda", kind: "EasyEDA" as const, size: 214_000, uploadedAt: iso(9) },
    { id: `${prefix}-f3`, name: "bom.csv", kind: "BOM" as const, size: 18_400, uploadedAt: iso(9) },
    { id: `${prefix}-f4`, name: "pick-place.txt", kind: "Pick & Place" as const, size: 9_200, uploadedAt: iso(9) },
    { id: `${prefix}-f5`, name: "board-render.png", kind: "Image" as const, size: 1_204_000, uploadedAt: iso(8) },
    { id: `${prefix}-f6`, name: "spec-sheet.pdf", kind: "PDF" as const, size: 512_000, uploadedAt: iso(8) },
  ];
}

interface SeedSpec {
  code: string;
  title: string;
  customer: Order["customer"];
  status: Order["status"];
  designer?: 1 | 2 | 3;
  ageDays: number;
  quote?: [number, number, number];
  pricing?: [number, number, number, number];
  payment?: Order["paymentStatus"];
}

const specs: SeedSpec[] = [
  { code: "CC-2601", title: "IoT Gateway Mainboard v3", customer: { name: "Alicia Gomez", company: "Nordvolt Systems", email: "alicia@nordvolt.io", phone: "+34 611 220 331", country: "Spain" }, status: "Delivered", designer: 1, ageDays: 96, quote: [180, 420, 90], pricing: [120, 210, 40, 25], payment: "Paid" },
  { code: "CC-2602", title: "Motor Driver 12A Rev B", customer: { name: "Tom Baker", company: "Baker Robotics", email: "tom@bakerrobotics.com", country: "UK" }, status: "Delivered", designer: 2, ageDays: 82, quote: [140, 310, 60], pricing: [90, 160, 20, 0], payment: "Paid" },
  { code: "CC-2603", title: "LoRa Sensor Node", customer: { name: "Hana Sato", company: "Kiyo Labs", email: "hana@kiyolabs.jp", country: "Japan" }, status: "Completed", designer: 1, ageDays: 61, quote: [95, 180, 40], pricing: [70, 120, 15, 10], payment: "Paid" },
  { code: "CC-2604", title: "BLDC ESC 60V", customer: { name: "Karl Weiss", company: "Weiss Drives", email: "karl@weissdrives.de", country: "Germany" }, status: "Printing", designer: 2, ageDays: 34, quote: [210, 520, 130], pricing: [150, 260, 45, 0], payment: "Partially Paid" },
  { code: "CC-2605", title: "Smart Meter Interface", customer: { name: "Ravi Kumar", company: "GridSense", email: "ravi@gridsense.in", country: "India" }, status: "Designing", designer: 1, ageDays: 21, quote: [160, 300, 70], pricing: [110, 190, 30, 20], payment: "Partially Paid" },
  { code: "CC-2606", title: "Audio DAC Breakout", customer: { name: "Emma Lind", company: "Lind Audio", email: "emma@lindaudio.se", country: "Sweden" }, status: "Customer Confirmed", designer: 3, ageDays: 16, quote: [80, 150, 25], pricing: [60, 95, 10, 0], payment: "Unpaid" },
  { code: "CC-2607", title: "Industrial CAN Hub", customer: { name: "Diego Rossi", company: "Rossi Automazione", email: "diego@rossi-auto.it", country: "Italy" }, status: "Price Approved", designer: 2, ageDays: 12, quote: [130, 260, 55], pricing: [95, 150, 25, 15], payment: "Unpaid" },
  { code: "CC-2608", title: "Battery BMS 6S", customer: { name: "Sara Ahmed", company: "Volt Nine", email: "sara@voltnine.ae", country: "UAE" }, status: "Price Submitted", designer: 1, ageDays: 8, quote: [175, 340, 85] },
  { code: "CC-2609", title: "Camera Carrier Board", customer: { name: "Peter Novak", company: "Visionix", email: "peter@visionix.cz", country: "Czechia" }, status: "Waiting for Price", designer: 3, ageDays: 6 },
  { code: "CC-2610", title: "RF Front-End 2.4GHz", customer: { name: "Lena Fischer", company: "Fischer RF", email: "lena@fischerrf.de", country: "Germany" }, status: "Under Review", designer: 2, ageDays: 4 },
  { code: "CC-2611", title: "Solar Charge Controller", customer: { name: "Kwame Mensah", company: "SunPath", email: "kwame@sunpath.gh", country: "Ghana" }, status: "Assigned", designer: 1, ageDays: 3 },
  { code: "CC-2612", title: "Wearable Flex PCB", customer: { name: "Yuki Tanaka", company: "Miru Health", email: "yuki@miruhealth.jp", country: "Japan" }, status: "New", ageDays: 1 },
  { code: "CC-2613", title: "Test Jig Adapter", customer: { name: "Owen Clarke", company: "Clarke Test", email: "owen@clarketest.au", country: "Australia" }, status: "New", ageDays: 0 },
  { code: "CC-2614", title: "Legacy Panel Rework", customer: { name: "Marta Silva", company: "Silva Eletro", email: "marta@silvaeletro.br", country: "Brazil" }, status: "Cancelled", ageDays: 44 },
];

export const seedOrders: Order[] = specs.map((s, index) => {
  const designer = s.designer ? seedUsers[s.designer]! : undefined;
  return {
    id: `o-${s.code}`,
    code: s.code,
    customer: s.customer,
    title: s.title,
    description: `${s.title} — production-ready PCB package including schematic review, layout, DFM check and fabrication handoff.`,
    requirements: "IPC Class 2, ENIG finish, impedance controlled signals on inner layers, 100% electrical test required.",
    layers: [2, 4, 6, 8][index % 4]!,
    quantity: [5, 10, 25, 50, 100][index % 5]!,
    material: "FR-4 TG150",
    thickness: "1.6 mm",
    surfaceFinish: "ENIG",
    color: index % 3 === 0 ? "Matte Black" : "Green",
    status: s.status,
    designerId: designer?.id,
    designerName: designer?.name,
    files: files(s.code),
    quote: s.quote
      ? {
          designCost: s.quote[0]!,
          printingCost: s.quote[1]!,
          assembly: s.quote[2]!,
          sourcing: 30,
          shipping: 25,
          testing: 18,
          extra: 0,
          notes: "Quote covers two revision rounds and DFM feedback.",
          submittedAt: iso(s.ageDays - 1),
          status: s.pricing ? "approved" : "submitted",
        }
      : undefined,
    pricing: s.pricing
      ? {
          serviceCharge: s.pricing[0]!,
          profitMargin: s.pricing[1]!,
          extraCharges: s.pricing[2]!,
          discount: s.pricing[3]!,
          confirmedAt: iso(Math.max(0, s.ageDays - 2)),
        }
      : undefined,
    paymentStatus: s.payment ?? "Unpaid",
    createdAt: iso(s.ageDays),
    updatedAt: iso(Math.max(0, s.ageDays - 1)),
    dueDate: new Date(now + (14 - (s.ageDays % 10)) * day).toISOString(),
  } as Order;
});

export const seedNotifications: Notification[] = [
  { id: "n1", to: "owner", title: "Designer submitted pricing", body: "Ishara Fernando submitted a quote for CC-2608.", orderId: "o-CC-2608", read: false, createdAt: iso(0.2) },
  { id: "n2", to: "owner", title: "Files uploaded", body: "Marek Nowak uploaded revised gerbers for CC-2610.", orderId: "o-CC-2610", read: false, createdAt: iso(0.5) },
  { id: "n3", to: "owner", title: "Order completed", body: "CC-2603 passed quality check and is completed.", orderId: "o-CC-2603", read: true, createdAt: iso(2) },
  { id: "n4", to: "designer", userId: "u-des-1", title: "New order assigned", body: "You have been assigned CC-2611 Solar Charge Controller.", orderId: "o-CC-2611", read: false, createdAt: iso(0.3) },
  { id: "n5", to: "designer", userId: "u-des-1", title: "Pricing approved", body: "Owner approved your quote for CC-2605.", orderId: "o-CC-2605", read: true, createdAt: iso(3) },
];

export const seedActivity: ActivityLog[] = [
  { id: "a1", action: "Order Created", detail: "CC-2613 Test Jig Adapter created", userName: "Nuwan Perera", role: "owner", createdAt: iso(0.1) },
  { id: "a2", action: "Price Submitted", detail: "Quote of $693 submitted for CC-2608", userName: "Ishara Fernando", role: "designer", createdAt: iso(0.4) },
  { id: "a3", action: "File Uploaded", detail: "gerber-rev-c.zip uploaded to CC-2610", userName: "Marek Nowak", role: "designer", createdAt: iso(0.6) },
  { id: "a4", action: "Price Approved", detail: "Owner approved quote for CC-2607", userName: "Nuwan Perera", role: "owner", createdAt: iso(1.2) },
  { id: "a5", action: "Invoice Generated", detail: "Invoice INV-2603 generated", userName: "Nuwan Perera", role: "owner", createdAt: iso(2.4) },
  { id: "a6", action: "User Login", detail: "Signed in from 102.54.11.9", userName: "Ishara Fernando", role: "designer", createdAt: iso(3) },
];

export const seedExpenses: Expense[] = [
  { id: "e1", label: "Fab house batch — JLC", amount: 1840, category: "Production", date: iso(12) },
  { id: "e2", label: "Designer payouts", amount: 2650, category: "Outsourcing", date: iso(20) },
  { id: "e3", label: "Courier & shipping", amount: 430, category: "Logistics", date: iso(26) },
  { id: "e4", label: "Software licenses", amount: 260, category: "Tools", date: iso(40) },
  { id: "e5", label: "Component sourcing", amount: 1290, category: "Production", date: iso(55) },
  { id: "e6", label: "Marketing", amount: 380, category: "Growth", date: iso(70) },
];
