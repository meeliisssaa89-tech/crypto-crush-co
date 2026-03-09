import { Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  totalTokens: number;
}

const allocations = [
  { label: "Task Completion", pct: 40, color: "from-emerald-500 to-teal-500" },
  { label: "Referral Bonus", pct: 25, color: "from-violet-500 to-purple-500" },
  { label: "Daily Activity", pct: 20, color: "from-amber-500 to-orange-500" },
  { label: "Special Events", pct: 15, color: "from-sky-500 to-blue-500" },
];

const AirdropTokenBreakdown = ({ totalTokens }: Props) => (
  <div className="glass rounded-xl p-4">
    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
      <Target className="h-4 w-4 text-primary" />
      Token Allocation
    </h3>
    <div className="space-y-3">
      {allocations.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color}`} />
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

export default AirdropTokenBreakdown;
