import { Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Allocation {
  label: string;
  pct: number;
}

interface Props {
  totalTokens: number;
  allocations?: Allocation[];
}

const defaultAllocations: Allocation[] = [
  { label: "Task Completion", pct: 40 },
  { label: "Referral Bonus", pct: 25 },
  { label: "Daily Activity", pct: 20 },
  { label: "Special Events", pct: 15 },
];

const colors = [
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-500",
];

const AirdropTokenBreakdown = ({ totalTokens, allocations }: Props) => {
  const allocs = allocations ?? defaultAllocations;

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        Token Allocation
      </h3>
      <div className="space-y-3">
        {allocs.map((item, i) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors[i % colors.length]}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{item.pct}%</span>
                <span className="text-xs font-semibold text-foreground">{Math.floor(totalTokens * item.pct / 100).toLocaleString()}</span>
              </div>
            </div>
            <Progress value={item.pct} className="h-1.5 bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AirdropTokenBreakdown;
