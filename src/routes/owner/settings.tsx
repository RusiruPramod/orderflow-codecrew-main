import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireRole } from "@/components/require-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePricingSettings } from "@/lib/db";
import { usePricingSettings, useRefresh } from "@/lib/queries";
import { DEFAULT_PRICING } from "@/lib/types";

export const Route = createFileRoute("/owner/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — CodeCrew PCB ERP" },
    ],
  }),
  component: () => (
    <RequireRole role="owner">
      <OwnerSettings />
    </RequireRole>
  ),
});

function OwnerSettings() {
  const { data: settings = DEFAULT_PRICING, isLoading } = usePricingSettings();
  const refresh = useRefresh();
  const [deliveryFee, setDeliveryFee] = useState(String(DEFAULT_PRICING.deliveryFee));
  const [stickerFee, setStickerFee] = useState(String(DEFAULT_PRICING.stickerFee));
  const [pricePerSqInch, setPricePerSqInch] = useState(String(DEFAULT_PRICING.pricePerSqInch));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setDeliveryFee(String(settings.deliveryFee));
      setStickerFee(String(settings.stickerFee));
      setPricePerSqInch(String(settings.pricePerSqInch));
    }
  }, [settings, isLoading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedDelivery = parseFloat(deliveryFee);
      const parsedSticker = parseFloat(stickerFee);
      const parsedSqInch = parseFloat(pricePerSqInch);
      
      if (isNaN(parsedDelivery) || isNaN(parsedSticker) || isNaN(parsedSqInch)) {
        throw new Error("Invalid pricing values");
      }

      await savePricingSettings({
        deliveryFee: parsedDelivery,
        stickerFee: parsedSticker,
        pricePerSqInch: parsedSqInch,
      });
      refresh();
      toast.success("Settings saved successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const copyCustomerFormLink = () => {
    const url = `${window.location.origin}/customer-order`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
  };

  return (
    <AppShell
      title="Settings"
      subtitle="Configure system-wide settings and pricing"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="surface-card p-6">
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold">Pricing Configuration</h2>
            <p className="text-sm text-muted-foreground">Adjust the default pricing used in the customer order form.</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Delivery Fee (LKR)</Label>
              <Input 
                type="number" 
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Sticker Fee (LKR)</Label>
              <Input 
                type="number" 
                value={stickerFee}
                onChange={(e) => setStickerFee(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Price per Square Inch (LKR)</Label>
              <Input 
                type="number" 
                value={pricePerSqInch}
                onChange={(e) => setPricePerSqInch(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <Button onClick={handleSave} disabled={saving || isLoading} className="rounded-xl w-full sm:w-auto">
              <Save className="mr-2 size-4" />
              {saving ? "Saving..." : "Save Pricing"}
            </Button>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold">Customer Order Form</h2>
            <p className="text-sm text-muted-foreground">Share this public link with customers so they can place orders without an account.</p>
          </div>
          
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3">
            <code className="flex-1 text-sm text-foreground overflow-x-auto whitespace-nowrap">
              {typeof window !== "undefined" ? `${window.location.origin}/customer-order` : ""}
            </code>
            <Button variant="secondary" size="sm" className="shrink-0" onClick={copyCustomerFormLink}>
              <Copy className="size-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
