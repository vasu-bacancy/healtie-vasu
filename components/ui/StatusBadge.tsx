import clsx from "clsx";

import { STATUS_COLOR, STATUS_LABEL } from "@/lib/db/appointments";

const BASE_STYLE = "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold";

type StatusBadgeProps = {
  status?: string | null;
  className?: string;
  unknownLabel?: string;
};

export default function StatusBadge({ status, className, unknownLabel = "Unknown status" }: StatusBadgeProps) {
  const colorClass = status ? STATUS_COLOR[status] ?? "bg-zinc-100 text-zinc-500" : "bg-zinc-100 text-zinc-500";
  const label = status ? STATUS_LABEL[status] ?? status : unknownLabel;

  return <span className={clsx(BASE_STYLE, colorClass, className)}>{label}</span>;
}
