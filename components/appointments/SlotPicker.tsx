"use client";

import { useState } from "react";

type Slot = { start: string; end: string; label: string };

export default function SlotPicker({ slots }: { slots: Slot[] }) {
  const [selected, setSelected] = useState<Slot | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-xs leading-5 text-[color:var(--muted)]">
        Choose the appointment start time that works best.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {slots.map((slot) => (
          <label
            key={slot.start}
            className={`motion-lift flex cursor-pointer items-center gap-3 rounded-[1rem] border px-4 py-3 text-sm transition ${
              selected?.start === slot.start
                ? "border-[color:var(--accent-soft-strong)] bg-[color:var(--surface-accent)] text-[color:var(--accent-ink)] shadow-[0_16px_30px_rgba(24,119,110,0.08)]"
                : "border-[color:var(--border-strong)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-subtle)]"
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
            <span className="font-medium">{slot.label}</span>
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
        <p className="text-xs leading-5 text-[color:var(--accent-ink)]">
          Selected time: {selected.label}
        </p>
      )}
    </div>
  );
}
