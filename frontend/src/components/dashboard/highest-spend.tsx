"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown } from "lucide-react";
import { TransactionResponse } from "@/types/transaction.dto";
import { useWallets } from "@/hooks/use-wallets";

interface HighestSpendProps {
  data: TransactionResponse[];
  isLoading: boolean;
}

export function HighestSpend({ data, isLoading }: HighestSpendProps) {
  const { wallets } = useWallets();

  return (
    <Card className=" shadow-sm h-full border-red-100 bg-red-50/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-red-700 flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Top chi tiêu
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5 mt-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tháng này chưa tiêu gì nhiều.
            </p>
          ) : (
            data.map((tx, index) => {
              const txCurrency =
                wallets.find((w: any) => w.id === tx.walletId)?.currency ||
                "VND";

              return (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Số thứ tự: 1, 2, 3 */}
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold 
                      ${
                        index === 0
                          ? "bg-red-500 text-white"
                          : index === 1
                            ? "bg-red-200 text-red-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none truncate max-w-[120px]">
                        {tx.categoryName || tx.note || "Chi tiêu"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(tx.date), "dd/MM", { locale: vi })}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-red-600 text-sm">
                    -{formatCurrency(tx.amount, txCurrency)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
