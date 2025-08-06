import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, Server, Globe, XCircle, ChevronDown, ChevronRight, Clock, Hash } from 'lucide-react';
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
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  if (errors.length === 0) {
    return null;
  }

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedErrors(newExpanded);
  };

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
          {errors.slice(0, 5).map((error, index) => {
            const isExpanded = expandedErrors.has(index);
            
            return (
              <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleExpanded(index)}>
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full p-4 h-auto justify-between hover:bg-muted/50"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-muted-foreground mt-0.5">
                          {getErrorIcon(error.responseCode)}
                        </div>
                        <div className="flex-1 space-y-2 text-left">
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
                        <div className="text-right">
                          <div className="text-lg font-semibold text-foreground">
                            {error.count.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            occurrences
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 border-t bg-muted/20">
                      <div className="mt-4 space-y-4">
                        {/* Error Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Count</div>
                              <div className="font-semibold">{error.count.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">% of Total Errors</div>
                              <div className="font-semibold">{error.percentage.toFixed(2)}%</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Transactions</div>
                              <div className="font-semibold">{error.affectedTransactions.length}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Response Code</div>
                              <div className="font-semibold font-mono">{error.responseCode}</div>
                            </div>
                          </div>
                        </div>

                        {/* Affected Transactions */}
                        {error.affectedTransactions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Affected Transactions
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {error.affectedTransactions.map((transaction, txIndex) => (
                                <Badge key={txIndex} variant="secondary" className="text-xs">
                                  {transaction}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Error Message */}
                        {error.errorMessage && (
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <XCircle className="h-4 w-4" />
                              Error Message
                            </h4>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                              <code className="text-sm text-foreground break-all">
                                {error.errorMessage}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};