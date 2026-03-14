"use client";

import { useState } from "react";

type Slot = { start: string; end: string; label: string };

export default function SlotPicker({ slots }: { slots: Slot[] }) {
  const [selected, setSelected] = useState<Slot | null>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs text-[color:var(--muted)]">
        Choose the appointment start time that works best.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => (
          <label
            key={slot.start}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
              selected?.start === slot.start
                ? "border-[color:var(--accent)] bg-[color:var(--surface)]"
                : "border-[color:var(--border)]"
            }`}
          >
            <input
              type="radio"
              name="scheduled_start"
              value={slot.start}
              required
              className="accent-[color:var(--accent)]"
              onChange={() => setSelected(slot)}
            />
            {slot.label}
          </label>
        ))}
      </div>
      {/* Single hidden input for the end time of the selected slot */}
      <input
        type="hidden"
        name="scheduled_end"
        value={selected?.end ?? ""}
      />
      {selected && (
        <p className="text-xs text-[color:var(--muted)]">
          Selected time: {selected.label}
        </p>
      )}
    </div>
  );
}
