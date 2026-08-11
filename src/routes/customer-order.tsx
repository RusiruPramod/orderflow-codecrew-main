import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, CloudUpload, FileArchive, FileText, Image as ImageIcon, Loader2, Plus, Trash2, Info, Calculator, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePricingSettings } from "@/lib/queries";
import { getUploadUrlFn } from "@/lib/r2Fns";
import { listOrders, nextOrderCode, upsert } from "@/lib/db";
import type { FileKind, Order, OrderFile, PcbFileMetadata } from "@/lib/types";
import { DEFAULT_PRICING, moneyLKR } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customer-order")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Place your PCB Order — CodeCrew" },
    ],
  }),
  component: CustomerOrderForm,
});

function kindFor(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["gbr", "gbl", "gtl", "gko"].includes(ext)) return "Gerber";
  if (ext === "easyeda") return "EasyEDA";
  if (ext === "json") return "JSON";
  if (["csv", "xls", "xlsx"].includes(ext)) return "BOM";
  if (["zip", "rar"].includes(ext)) return "ZIP";
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

function CustomerOrderForm() {
  const { data: settings = DEFAULT_PRICING, isLoading: isSettingsLoading } = usePricingSettings();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showPhone2, setShowPhone2] = useState(false);
  const [files, setFiles] = useState<Array<{ meta: OrderFile; raw: File }>>([]);

  const [form, setForm] = useState({
    name: "",
    telephone1: "",
    telephone2: "",
    addressLine1: "",
    material: "Copper Clad",
    stickerOption: "Without Sticker" as "With Sticker" | "Without Sticker",
  });

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

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

  const deliveryFee = settings.deliveryFee;
  const stickerFee = form.stickerOption === "With Sticker" ? settings.stickerFee : 0;

  const canSubmit = form.name.trim() && form.telephone1.trim() && form.addressLine1.trim() && files.length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setUploadProgress(null);
    try {
      const existing = await listOrders();
      const code = nextOrderCode(existing);
      const nowIso = new Date().toISOString();

      let pcbFile: PcbFileMetadata | undefined;
      const orderFiles: OrderFile[] = [];

      if (files.length > 0) {
        setUploadProgress({ done: 0, total: files.length });

        for (let i = 0; i < files.length; i++) {
          const { meta, raw } = files[i];
          try {
            const { uploadUrl, fileKey } = await getUploadUrlFn({
              data: {
                fileName: meta.name,
                contentType: raw.type || "application/octet-stream",
                orderCode: code,
              },
            });

            const uploadRes = await fetch(uploadUrl, {
              method: "PUT",
              body: raw,
            });

            if (!uploadRes.ok) {
              const errText = await uploadRes.text().catch(() => "");
              throw new Error(`R2 upload failed (${uploadRes.status}): ${errText || uploadRes.statusText}`);
            }

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

            orderFiles.push({ ...meta, id: `f-${code}-${i}` });
          } catch (uploadErr: any) {
            console.error(uploadErr);
            toast.error(uploadErr?.message ? `Upload failed: ${uploadErr.message}` : `Failed to upload ${meta.name}.`);
            setSaving(false);
            setUploadProgress(null);
            return;
          }

          setUploadProgress({ done: i + 1, total: files.length });
        }
      }

      const order: Order = {
        id: `o-${code}`,
        code,
        customer: {
          name: form.name,
          addressLine1: form.addressLine1,
          telephone1: form.telephone1,
          telephone2: form.telephone2,
        },
        title: `Customer Order: ${form.name}`,
        description: `Order submitted by ${form.name} via public form.`,
        requirements: "",
        layers: 2, // Default
        quantity: 1, // Default
        material: form.material,
        thickness: "1.6 mm", // Default
        surfaceFinish: form.stickerOption,
        color: "Green", // Default
        status: "New",
        files: orderFiles,
        pcbFile,
        paymentStatus: "Unpaid",
        createdAt: nowIso,
        updatedAt: nowIso,
        source: "customer-form",
        additionalCharges: {
          deliveryFee: settings.deliveryFee,
          stickerFee: settings.stickerFee,
          stickerOption: form.stickerOption === "With Sticker" ? "with" : "without",
          pcbPrintPrice,
        },
        pcbLength: parsedLength,
        pcbWidth: parsedWidth,
      };

      await upsert<Order>("orders", order);

      setSuccess(true);
      toast.success(`Order submitted successfully`);
    } catch {
      toast.error("Could not submit the order. Please try again.");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md surface-card p-8 text-center rounded-3xl shadow-xl border border-border">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-green-500/10">
            <Check className="size-10 text-green-600" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3">Order Submitted!</h1>
          <p className="text-muted-foreground text-base mb-4">
            Thank you, <span className="font-semibold text-foreground">{form.name}</span>!
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your order has been received. Our team will review your files, calculate the final cost, and contact you shortly with a quote.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <span>CodeCrew PCB Services</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="mb-8 mt-4">
        <Logo />
      </div>

      <div className="w-full max-w-2xl surface-card p-6 sm:p-8 rounded-3xl shadow-lg border border-border">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold">PCB Order Form</h1>
          <p className="text-sm text-muted-foreground mt-2">Fill out the details below to submit your order directly to our team.</p>
        </div>

        <div className="space-y-6">
          {/* Customer Details */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold border-b pb-2">Your Details</h2>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="h-11 rounded-xl"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Telephone Number *</Label>
              <div className="flex gap-2">
                <Input
                  value={form.telephone1}
                  onChange={(e) => set("telephone1", e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="07X XXX XXXX"
                />
                {!showPhone2 && (
                  <Button type="button" variant="outline" className="h-11 px-3 rounded-xl" onClick={() => setShowPhone2(true)} title="Add another phone">
                    <Plus className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {showPhone2 && (
              <div className="space-y-2">
                <Label>Telephone Number 2</Label>
                <Input
                  value={form.telephone2}
                  onChange={(e) => set("telephone2", e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="Optional secondary number"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Delivery Address *</Label>
              <Input
                value={form.addressLine1}
                onChange={(e) => set("addressLine1", e.target.value)}
                className="h-11 rounded-xl"
                placeholder="Full address for delivery"
              />
            </div>
          </div>

          {/* PCB Options */}
          <div className="space-y-4 pt-4">
            <h2 className="font-display text-lg font-semibold border-b pb-2">PCB Options</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Material Selection</Label>
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

              <div className="space-y-2">
                <Label>Sticker Option</Label>
                <Select value={form.stickerOption} onValueChange={(v) => set("stickerOption", v as any)}>
                  <SelectTrigger className="h-11 rounded-xl bg-background">
                    <SelectValue placeholder="Select sticker option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="With Sticker">With Sticker (+{moneyLKR(settings.stickerFee)})</SelectItem>
                    <SelectItem value="Without Sticker">Without Sticker</SelectItem>
                  </SelectContent>
                </Select>
              </div>


            </div>
          </div>

          {/* Files */}
          <div className="space-y-4 pt-4">
            <h2 className="font-display text-lg font-semibold border-b pb-2">Project Files *</h2>

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
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                dragging ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50",
              )}
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <CloudUpload className="size-6" />
              </span>
              <span className="font-display text-base font-semibold">Drop your design files here</span>
              <span className="text-xs text-muted-foreground">
                or click to browse
              </span>
              <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </label>

            <div className="mt-4 space-y-2">
              {files.map(({ meta }) => {
                const Icon = iconFor(meta.kind);
                return (
                  <div key={meta.id} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 bg-background">
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
                      className="text-muted-foreground hover:text-destructive p-2"
                      aria-label={`Remove ${meta.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
              {files.length === 0 && (
                <p className="text-center text-xs text-muted-foreground text-destructive/80">Please attach at least one file.</p>
              )}
            </div>
          </div>

          {/* Pricing Summary */}
          {!isSettingsLoading && (
            <div className="bg-primary/5 rounded-3xl p-6 mt-8 border-2 border-primary/20 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">

              </div>

              <div className="flex items-center gap-2 mb-4 text-primary">

                <h3 className="font-display font-semibold text-lg">Preliminary Cost Estimate</h3>
              </div>

              <div className="space-y-3 text-sm relative z-10">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    PCB Print Cost
                    {parsedLength > 0 && parsedWidth > 0 && (
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full">
                        {parsedLength}″ × {parsedWidth}″ @ {settings.pricePerSqInch}/sq in
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-muted-foreground flex items-center h-full">
                    {(parsedLength === 0 || parsedWidth === 0) ? (
                      <div className="w-16 h-1.5 bg-primary/10 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 bottom-0 bg-primary/50 rounded-full" style={{ width: '40%', animation: 'indeterminate 1.5s infinite ease-in-out' }} />
                      </div>
                    ) : (
                      <span className="text-foreground">{moneyLKR(pcbPrintPrice)}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">PCB Design Cost</span>
                  <span className="font-medium text-muted-foreground flex items-center h-full">
                    <div className="w-16 h-1.5 bg-primary/10 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 bg-primary/50 rounded-full" style={{ width: '40%', animation: 'indeterminate 1.5s infinite ease-in-out' }} />
                    </div>
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">{moneyLKR(deliveryFee)}</span>
                </div>
                {form.stickerOption === "With Sticker" && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Sticker Fee</span>
                    <span className="font-medium">{moneyLKR(stickerFee)}</span>
                  </div>
                )}

                <div className="pt-4 mt-2 border-t border-primary/20">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs font-semibold tracking-wide text-primary uppercase mb-2">Final Total</div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-primary/10 rounded-full overflow-hidden relative">
                          <div
                            className="absolute top-0 bottom-0 bg-primary/50 rounded-full"
                            style={{
                              width: '40%',
                              animation: 'indeterminate 1.5s infinite ease-in-out'
                            }}
                          />
                          <style>{`
                            @keyframes indeterminate {
                              0% { transform: translateX(-100%); }
                              100% { transform: translateX(300%); }
                            }
                          `}</style>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground"></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-4 rounded-2xl">
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold block mb-1">Final Cost Pending Review</span>
                    <p className="opacity-90 leading-snug">
                      Your <strong>PCB Design Price</strong> will be calculated based on your specific requirements and added to this base total. We will contact you with the final quote.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6">
            <Button
              className="w-full rounded-xl h-12 text-base shadow-lg"
              disabled={!canSubmit || saving}
              onClick={submit}
            >
              {uploadProgress
                ? <><Loader2 className="size-5 mr-2 animate-spin" /> Uploading {uploadProgress.done}/{uploadProgress.total}…</>
                : saving
                  ? "Submitting..."
                  : "Submit Order"
              }
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-4">
              By submitting, you agree to CodeCrew's terms of service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
