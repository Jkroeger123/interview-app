import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TransactionHistoryProps {
  userId: string;
}

export async function TransactionHistory({ userId }: TransactionHistoryProps) {
  // Fetch recent transactions
  const transactions = await prisma.creditLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>No transactions yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Your credit purchases and usage will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          Recent credit purchases and deductions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(transaction.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      transaction.type === "purchase"
                        ? "default"
                        : transaction.type === "deduction"
                        ? "secondary"
                        : transaction.type === "refund"
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {transaction.description || "No description"}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    transaction.amount > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {transaction.amount}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {transaction.balance}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}



