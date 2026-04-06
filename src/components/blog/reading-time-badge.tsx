import { PiClock } from "react-icons/pi";

export function ReadingTimeBadge({ minutes }: { minutes: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-dim">
      <PiClock size={14} />
      {minutes} min read
    </span>
  );
}
