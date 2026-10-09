import { useEffect, useState } from "react";
import { Clock, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AvailabilityUnit = "minutes" | "days";

const MINUTE_PRESETS = [10, 20, 30, 45, 60];
const DAY_PRESETS = [1, 2, 3, 7];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (unit: AvailabilityUnit, value: number) => void;
}

export default function AvailabilityDialog({ open, onOpenChange, onConfirm }: Props) {
  const [unit, setUnit] = useState<AvailabilityUnit>("minutes");
  const [value, setValue] = useState<number | null>(null);
  const [custom, setCustom] = useState("");

  useEffect(() => { if (open) { setUnit("minutes"); setValue(null); setCustom(""); } }, [open]);

  const presets = unit === "minutes" ? MINUTE_PRESETS : DAY_PRESETS;
  const label = (v: number) => unit === "minutes" ? (v === 60 ? "1 hr" : `${v} min`) : (v === 7 ? "1 week" : `${v} day${v > 1 ? "s" : ""}`);
  const customNum = parseInt(custom, 10);
  const final = custom ? (Number.isFinite(customNum) && customNum > 0 && customNum <= 10000 ? customNum : null) : value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Service available within</DialogTitle>
          <DialogDescription>Tell the customer when you can provide this service.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <Button variant={unit === "minutes" ? "default" : "outline"} className="h-11" onClick={() => { setUnit("minutes"); setValue(null); setCustom(""); }}>
            <Clock className="mr-2 h-4 w-4" />Within time
          </Button>
          <Button variant={unit === "days" ? "default" : "outline"} className="h-11" onClick={() => { setUnit("days"); setValue(null); setCustom(""); }}>
            <CalendarDays className="mr-2 h-4 w-4" />Within days
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((p) => (
            <Button key={p} variant={!custom && value === p ? "default" : "outline"} className="h-11" onClick={() => { setValue(p); setCustom(""); }}>
              {label(p)}
            </Button>
          ))}
        </div>
        <Input type="number" inputMode="numeric" min={1} placeholder={unit === "minutes" ? "Or type minutes" : "Or type days"}
          value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))} className="h-11" />
        <Button className="delivery-gradient h-11" disabled={!final} onClick={() => final && onConfirm(unit, final)}>
          Confirm & accept
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export const formatAvailability = (unit?: string | null, value?: number | null) => {
  if (!unit || !value) return null;
  if (unit === "minutes") return value % 60 === 0 ? `${value / 60} hr${value > 60 ? "s" : ""}` : `${value} min`;
  return value === 7 ? "1 week" : `${value} day${value > 1 ? "s" : ""}`;
};
