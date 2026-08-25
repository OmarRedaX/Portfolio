import type { ProjectMetric } from "@/content";

export function MetricStat({ label, value }: ProjectMetric) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-h2 text-accent">{value}</span>
      <span className="tag w-fit">{label}</span>
    </div>
  );
}
