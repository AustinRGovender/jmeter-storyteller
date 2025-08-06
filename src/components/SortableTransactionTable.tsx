import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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

type SortField = 'label' | 'count' | 'avgResponseTime' | 'errorRate' | 'errorCount';
type SortDirection = 'asc' | 'desc';

export const TransactionTable = ({ transactions }: TransactionTableProps) => {
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'label':
        return multiplier * a.label.localeCompare(b.label);
      case 'count':
        return multiplier * (a.count - b.count);
      case 'avgResponseTime':
        return multiplier * (a.avgResponseTime - b.avgResponseTime);
      case 'errorRate':
        return multiplier * (a.errorRate - b.errorRate);
      case 'errorCount':
        return multiplier * (a.errorCount - b.errorCount);
      default:
        return 0;
    }
  });

  // Save sort preferences to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('transactionTableSort');
    if (saved) {
      try {
        const { field, direction } = JSON.parse(saved);
        setSortField(field);
        setSortDirection(direction);
      } catch (error) {
        console.error('Error loading sort preferences:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('transactionTableSort', JSON.stringify({
      field: sortField,
      direction: sortDirection
    }));
  }, [sortField, sortDirection]);

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
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('label')}
                    className="h-auto p-0 font-semibold justify-start gap-2 text-foreground"
                  >
                    Transaction
                    {getSortIcon('label')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('count')}
                    className="h-auto p-0 font-semibold justify-end gap-2 text-foreground ml-auto flex"
                  >
                    Requests
                    {getSortIcon('count')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('avgResponseTime')}
                    className="h-auto p-0 font-semibold justify-end gap-2 text-foreground ml-auto flex"
                  >
                    Avg Response Time
                    {getSortIcon('avgResponseTime')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('errorRate')}
                    className="h-auto p-0 font-semibold justify-end gap-2 text-foreground ml-auto flex"
                  >
                    Error Rate
                    {getSortIcon('errorRate')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('errorCount')}
                    className="h-auto p-0 font-semibold justify-end gap-2 text-foreground ml-auto flex"
                  >
                    Errors
                    {getSortIcon('errorCount')}
                  </Button>
                </TableHead>
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