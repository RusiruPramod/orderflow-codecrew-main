import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CloudUpload,
  FileArchive,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { listOrders, logActivity, nextOrderCode, notify, upsert } from "@/lib/db";
import { useUsers } from "@/lib/queries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUploadUrlFn } from "@/lib/r2Fns";
import type { FileKind, Order, OrderFile, PcbFileMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/owner/orders/new")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create PCB Order — CodeCrew PCB ERP" },
      { name: "description", content: "Capture customer details, PCB requirements, project files and assign a designer." },
      { property: "og:title", content: "Create PCB Order — CodeCrew PCB ERP" },
      { property: "og:description", content: "Five-step intake for new PCB manufacturing orders." },
    ],
  }),
  component: () => (
    <RequireRole role="owner">
      <NewOrder />
    </RequireRole>
  ),
});

const STEPS = ["Customer", "PCB Details", "Files", "Designer", "Review"];

function kindFor(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["gbr", "gbl", "gtl", "gko"].includes(ext)) return "Gerber";
  if (ext === "easyeda") return "EasyEDA";
  if (ext === "json") return "JSON";
  if (["csv", "xls", "xlsx"].includes(ext)) return "BOM";
  if (ext === "zip" || ext === "rar") return "ZIP";
  if (ext === "pdf") return "PDF";
  if (["png", "jpg", "jpeg", "webp", "svg"].includes(ext)) return "Image";
  if (["txt", "pos"].includes(ext)) return "Pick & Place";
  return "Document";
}

function iconFor(kind: FileKind) {
  if (kind === "Image") return ImageIcon;
  if (kind === "PDF" || kind === "Document") return FileText;
  return FileArchive;
}

function NewOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: users = [] } = useUsers();
  const designers = users.filter((u) => u.role === "designer" && u.active);
  const hasInitializedDesigner = useRef(false);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showPhone2, setShowPhone2] = useState(false);
  // Holds both the display metadata and the original File object for upload
  const [files, setFiles] = useState<Array<{ meta: OrderFile; raw: File }>>([]); 
  const [designerId, setDesignerId] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    addressLine1: "",
    addressLine2: "",
    telephone1: "",
    telephone2: "",
    title: "",
    description: "",
    requirements: "",
    layers: "1",
    quantity: "1",
    material: "Copper Clad",
    thickness: "1.6 mm",
    surfaceFinish: "Sticker With",
    color: "Green",
    notes: "",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!hasInitializedDesigner.current && designers.length === 1) {
      setDesignerId(designers[0].id);
      hasInitializedDesigner.current = true;
    }
  }, [designers]);

  const canContinue = useMemo(() => {
    if (step === 0) return form.name.trim() && form.addressLine1.trim() && form.telephone1.trim();
    if (step === 1) return form.title.trim() && form.description.trim();
    return true;
  }, [step, form]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const mapped = Array.from(list).map((file, i) => ({
      meta: {
        id: `f-${Date.now()}-${i}`,
        name: file.name,
        kind: kindFor(file.name),
        size: file.size,
        uploadedAt: new Date().toISOString(),
      } as OrderFile,
      raw: file,
    }));
    setFiles((prev) => [...prev, ...mapped]);
    toast.success(`${mapped.length} file(s) attached`);
  };

  const submit = async () => {
    setSaving(true);
    setUploadProgress(null);
    try {
      const existing = await listOrders();
      const code = nextOrderCode(existing);
      const designer = designers.find((d) => d.id === designerId);
      const nowIso = new Date().toISOString();

      // ── Step 1: Upload each file to R2 via presigned PUT URL ──────────────
      let pcbFile: PcbFileMetadata | undefined;
      const orderFiles: OrderFile[] = [];

      if (files.length > 0) {
        setUploadProgress({ done: 0, total: files.length });

        for (let i = 0; i < files.length; i++) {
          const { meta, raw } = files[i];
          try {
            // Get presigned upload URL from the server
            const { uploadUrl, fileKey } = await getUploadUrlFn({
              data: {
                fileName: meta.name,
                contentType: raw.type || "application/octet-stream",
                orderCode: code,
              },
            });

            // Upload directly to R2 — the large file never touches Vercel
            const uploadRes = await fetch(uploadUrl, {
              method: "PUT",
              body: raw,
            });

            if (!uploadRes.ok) {
              const errText = await uploadRes.text().catch(() => "");
              throw new Error(`R2 upload failed (${uploadRes.status}): ${errText || uploadRes.statusText}`);
            }

            // Save R2 metadata for the primary (first) file
            if (i === 0) {
              pcbFile = {
                fileName: meta.name,
                fileSize: meta.size,
                fileType: raw.type || "application/octet-stream",
                storageKey: fileKey,
                storageProvider: "cloudflare-r2",
                uploadedAt: nowIso,
              };
            }

            // Keep display metadata (no URL — files live in R2)
            orderFiles.push({ ...meta, id: `f-${code}-${i}` });
          } catch (uploadErr) {
            console.error(uploadErr);
            toast.error(`Failed to upload ${meta.name}. Order not created.`);
            setSaving(false);
            setUploadProgress(null);
            return;
          }

          setUploadProgress({ done: i + 1, total: files.length });
        }
      }

      // ── Step 2: Save order to Firestore ───────────────────────────────────
      const order = {
        id: `o-${code}`,
        code,
        customer: {
          name: form.name,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          telephone1: form.telephone1,
          telephone2: form.telephone2,
        },
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        layers: Number(form.layers) || 2,
        quantity: Number(form.quantity) || 1,
        material: form.material,
        thickness: form.thickness,
        surfaceFinish: form.surfaceFinish,
        color: form.color,
        notes: form.notes,
        status: designer ? "Assigned" : "New",
        designerId: designer?.id,
        designerName: designer?.name,
        files: orderFiles,
        pcbFile,            // R2 metadata — only set when files were uploaded
        paymentStatus: "Unpaid",
        createdAt: nowIso,
        updatedAt: nowIso,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      } as Order;

      await upsert<Order>("orders", order);
      await logActivity({
        action: "Order Created",
        detail: `${code} ${order.title} created`,
        userName: user?.name ?? "Owner",
        role: "owner",
      });
      if (designer) {
        await notify({
          to: "designer",
          userId: designer.id,
          title: "New order assigned",
          body: `${code} — ${order.title} has been assigned to you.`,
          orderId: order.id,
        });
      }
      await queryClient.invalidateQueries();
      toast.success(`Order ${code} created`);
      void navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
    } catch {
      toast.error("Could not create the order");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  // PcbFileMetadata type is already imported at the top

  return (
    <AppShell title="Create New Order" subtitle="Five quick steps from customer to designer handoff">
      <div className="mx-auto max-w-4xl">
        <div className="surface-card mb-4 flex items-center gap-2 overflow-x-auto p-4">
          {STEPS.map((label, index) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => index < step && setStep(index)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  index === step
                    ? "bg-primary-soft font-semibold text-accent-foreground"
                    : index < step
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    index <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {index < step ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {index < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        <div className="surface-card p-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer name *" value={form.name} onChange={(v) => set("name", v)} />
              <Field label="Address Line 1 *" value={form.addressLine1} onChange={(v) => set("addressLine1", v)} />
              <Field label="Address Line 2" value={form.addressLine2} onChange={(v) => set("addressLine2", v)} />
              
              <div className="space-y-2">
                <Label>Telephone Number 1 *</Label>
                <div className="flex gap-2">
                  <Input value={form.telephone1} onChange={(e) => set("telephone1", e.target.value)} className="h-11 rounded-xl" />
                  {!showPhone2 && (
                    <Button type="button" variant="outline" className="h-11 px-3" onClick={() => setShowPhone2(true)} title="Add another phone">
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {showPhone2 && (
                <Field label="Telephone Number 2" value={form.telephone2} onChange={(v) => set("telephone2", v)} />
              )}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Project title *" value={form.title} onChange={(v) => set("title", v)} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Description *</Label>
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="rounded-xl"
                  placeholder="What is this board for, what needs designing or fabricating?"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>PCB requirements</Label>
                <Textarea
                  rows={3}
                  value={form.requirements}
                  onChange={(e) => set("requirements", e.target.value)}
                  className="rounded-xl"
                  placeholder="Impedance control, IPC class, test coverage, stack-up notes…"
                />
              </div>
              <Field label="Layers" type="number" value={form.layers} onChange={(v) => set("layers", v)} />
              <Field label="Quantity" type="number" value={form.quantity} onChange={(v) => set("quantity", v)} />
              
              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={form.material} onValueChange={(v) => set("material", v)}>
                  <SelectTrigger className="h-11 rounded-xl bg-background">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Copper Clad">Copper Clad</SelectItem>
                    <SelectItem value="FR4">FR4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Field label="Thickness" value={form.thickness} onChange={(v) => set("thickness", v)} />
              
              <div className="space-y-2">
                <Label>Surface finish</Label>
                <Select value={form.surfaceFinish} onValueChange={(v) => set("surfaceFinish", v)}>
                  <SelectTrigger className="h-11 rounded-xl bg-background">
                    <SelectValue placeholder="Select finish" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sticker With">Sticker With</SelectItem>
                    <SelectItem value="Sticker Without">Sticker Without</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Solder mask colour" value={form.color} onChange={(v) => set("color", v)} />
              <Field label="Target due date" type="date" value={form.dueDate} onChange={(v) => set("dueDate", v)} />
            </div>
          )}

          {step === 2 && (
            <div>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
                  dragging ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50",
                )}
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                  <CloudUpload className="size-6" />
                </span>
                <span className="font-display text-base font-semibold">Drop PCB files here</span>
                <span className="text-xs text-muted-foreground">
                  Gerber · EasyEDA · JSON · BOM · Pick &amp; Place · ZIP · PDF · Images · DXF · STEP
                </span>
                <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>

              <div className="mt-4 space-y-2">
                {files.map(({ meta }) => {
                  const Icon = iconFor(meta.kind);
                  return (
                    <div key={meta.id} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                      <Icon className="size-4 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{meta.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {meta.kind} · {(meta.size / 1024).toFixed(0)} KB
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((f) => f.meta.id !== meta.id))}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${meta.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })}
                {files.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground">No files attached yet.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {designers.map((designer) => (
                <button
                  key={designer.id}
                  type="button"
                  onClick={() => {
                    if (designers.length === 1) {
                      setDesignerId(designers[0].id);
                      return;
                    }
                    setDesignerId(designer.id === designerId ? "" : designer.id);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                    designerId === designer.id
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span className="grid size-10 place-items-center rounded-full bg-secondary font-display font-semibold">
                    {designer.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{designer.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{designer.specialty}</span>
                  </span>
                  {designerId === designer.id && <Check className="ml-auto size-4 text-primary" />}
                </button>
              ))}
              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground sm:col-span-2">
                <UserPlus className="size-4" />
                This order will be assigned to Malaka Thushan by default.
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-sm">
              <Summary title="Customer" rows={[["Name", form.name], ["Telephone", form.telephone1], ["Address", form.addressLine1]]} />
              <Summary
                title="PCB"
                rows={[
                  ["Title", form.title],
                  ["Layers", form.layers],
                  ["Quantity", form.quantity],
                  ["Finish", form.surfaceFinish],
                ]}
              />
              <Summary
                title="Handoff"
                rows={[
                  ["Files", `${files.length} attached`],
                  ["Designer", designers.find((d) => d.id === designerId)?.name ?? "Unassigned"],
                ]}
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button className="rounded-xl" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button className="rounded-xl" disabled={saving} onClick={submit}>
                {uploadProgress
                  ? <><Loader2 className="size-4 animate-spin" /> Uploading {uploadProgress.done}/{uploadProgress.total}…</>
                  : saving
                    ? "Saving…"
                    : "Create order"
                }
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl" />
    </div>
  );
}

function Summary({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="font-display text-sm font-semibold">{title}</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="truncate font-medium">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
