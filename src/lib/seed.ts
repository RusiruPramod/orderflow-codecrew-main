import type { ActivityLog, AppUser, Expense, Notification, Order } from "./types";

const now = Date.now();
const day = 86_400_000;
const iso = (offsetDays: number) => new Date(now - offsetDays * day).toISOString();

export const seedUsers: AppUser[] = [
  {
    id: "owner",
    name: "Rusiru pramod",
    email: "rusirupramod@gmail.com",
    role: "owner",
    active: true,
    joinedAt: iso(420),
    specialty: "Founder / Operations",
  },
  {
    id: "u-des-1",
    name: "Malaka Thushan",
    email: "malakathushan@gmail.com",
    role: "designer",
    active: true,
    joinedAt: iso(210),
    specialty: "High-speed 4–8 layer routing",
    phone: "+94 77 555 1201",
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

const specs: SeedSpec[] = [];

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
  { id: "n1", to: "owner", title: "Designer submitted pricing", body: "Malaka Thushan submitted a quote for CC-2608.", orderId: "o-CC-2608", read: false, createdAt: iso(0.2) },
  { id: "n2", to: "owner", title: "Files uploaded", body: "Malaka Thushan uploaded revised gerbers for CC-2610.", orderId: "o-CC-2610", read: false, createdAt: iso(0.5) },
];

export const seedActivity: ActivityLog[] = [
  { id: "a1", action: "Order Created", detail: "CC-2613 Test Jig Adapter created", userName: "Owner", role: "owner", createdAt: iso(0.1) },
  { id: "a2", action: "Price Submitted", detail: "Quote of $693 submitted for CC-2608", userName: "Malaka Thushan", role: "designer", createdAt: iso(0.4) },
  { id: "a6", action: "User Login", detail: "Signed in from 102.54.11.9", userName: "Malaka Thushan", role: "designer", createdAt: iso(3) },
];

export const seedExpenses: Expense[] = [];
