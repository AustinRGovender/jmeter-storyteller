import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Server, Globe, XCircle } from 'lucide-react';
import { ErrorAnalysis } from '@/utils/jtlParser';

interface TopErrorsSectionProps {
  errors: ErrorAnalysis[];
}

const getErrorIcon = (responseCode: string) => {
  const code = parseInt(responseCode);
  if (code >= 500) return <Server className="h-4 w-4" />;
  if (code >= 400) return <XCircle className="h-4 w-4" />;
  if (responseCode === 'Non HTTP response code') return <Globe className="h-4 w-4" />;
  return <AlertTriangle className="h-4 w-4" />;
};

const getErrorVariant = (percentage: number): "default" | "secondary" | "outline" | "destructive" => {
  if (percentage >= 50) return "destructive";
  if (percentage >= 20) return "secondary";
  return "outline";
};

export const TopErrorsSection: React.FC<TopErrorsSectionProps> = ({ errors }) => {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Top 5 Errors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {errors.slice(0, 5).map((error, index) => (
            <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-muted-foreground mt-0.5">
                  {getErrorIcon(error.responseCode)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {error.responseCode}
                    </Badge>
                    <Badge variant={getErrorVariant(error.percentage)}>
                      {error.percentage.toFixed(1)}% of errors
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {error.errorMessage || 'Unknown error'}
                  </p>
                  {error.affectedTransactions.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Affected: {error.affectedTransactions.slice(0, 3).join(', ')}
                      {error.affectedTransactions.length > 3 && ` +${error.affectedTransactions.length - 3} more`}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-foreground">
                  {error.count.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  occurrences
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};