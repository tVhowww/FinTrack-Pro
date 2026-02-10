"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionResponse } from "@/types/transaction.dto";

interface RecentTransactionsProps {
  data: TransactionResponse[];
  isLoading: boolean;
}

export function RecentTransactions({
  data,
  isLoading,
}: RecentTransactionsProps) {
  return (
    <Card className="col-span-3 shadow-sm h-full">
      <CardHeader>
        <CardTitle>Giao dịch gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {isLoading ? (
            // Skeleton Loading cho đẹp
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            ))
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có giao dịch nào.
            </p>
          ) : (
            data.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-9 w-9 border transition-transform group-hover:scale-105">
                    <AvatarFallback
                      className={
                        tx.type === "EXPENSE"
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }
                    >
                      {tx.categoryName ? tx.categoryName[0] : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {tx.categoryName || "Giao dịch khác"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.date), "d MMM, yyyy", { locale: vi })}
                    </p>
                  </div>
                </div>
                <div
                  className={`text-sm font-medium ${
                    tx.type === "EXPENSE" ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {tx.type === "EXPENSE" ? "-" : "+"}
                  {formatCurrency(tx.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
