import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  label: string;
  count: number;
  avgResponseTime: number;
  errorRate: number;
  errorCount: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export const TransactionTable = ({ transactions }: TransactionTableProps) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getErrorBadgeVariant = (errorRate: number) => {
    if (errorRate === 0) return "default";
    if (errorRate < 1) return "secondary";
    if (errorRate < 5) return "outline";
    return "destructive";
  };

  const sortedTransactions = [...transactions].sort((a, b) => b.count - a.count);

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground">Transaction Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Transaction</TableHead>
                <TableHead className="font-semibold text-right">Requests</TableHead>
                <TableHead className="font-semibold text-right">Avg Response Time</TableHead>
                <TableHead className="font-semibold text-right">Error Rate</TableHead>
                <TableHead className="font-semibold text-right">Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((transaction, index) => (
                <TableRow 
                  key={transaction.label} 
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate" title={transaction.label}>
                      {transaction.label}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {transaction.count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatDuration(transaction.avgResponseTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getErrorBadgeVariant(transaction.errorRate)}>
                      {transaction.errorRate.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {transaction.errorCount > 0 ? (
                      <span className="text-destructive font-semibold">
                        {transaction.errorCount}
                      </span>
                    ) : (
                      <span className="text-success">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {transactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No transaction data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};