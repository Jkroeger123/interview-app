import { Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CreditBalanceProps {
  credits: number;
}

export function CreditBalance({ credits }: CreditBalanceProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Your Balance</p>
            <div className="flex items-center gap-2">
              <Coins className="size-8" />
              <span className="text-4xl font-bold">{credits}</span>
              <span className="text-2xl opacity-90">credits</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm opacity-90 mb-1">Value</p>
            <p className="text-2xl font-semibold">${credits}</p>
            <p className="text-xs opacity-75">($1 per credit)</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm opacity-90">
            💡 Each credit = 1 minute of interview practice
          </p>
        </div>
      </CardContent>
    </Card>
  );
}



