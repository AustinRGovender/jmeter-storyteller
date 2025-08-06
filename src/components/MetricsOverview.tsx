import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, Zap, AlertTriangle, CheckCircle, Timer, Activity, Gauge } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: 'success' | 'warning' | 'error' | 'info';
}

const MetricCard = ({ title, value, change, trend, icon, color }: MetricCardProps) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'text-success border-success/20 bg-success/5';
      case 'warning':
        return 'text-warning border-warning/20 bg-warning/5';
      case 'error':
        return 'text-error border-error/20 bg-error/5';
      case 'info':
        return 'text-info border-info/20 bg-info/5';
      default:
        return 'text-primary border-primary/20 bg-primary/5';
    }
  };

  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-elegant transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${getColorClasses()}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1 text-success" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1 text-error" />}
            <span>{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PerformanceMetrics {
  avgResponseTime: number;
  maxResponseTime: number;
  throughput: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  transactionsPerSecond: number;
  testDuration: number;
  p90ResponseTime: number;
  p99ResponseTime: number;
  avgConnectTime: number;
}

interface MetricsOverviewProps {
  metrics: PerformanceMetrics;
}

export const MetricsOverview = ({ metrics }: MetricsOverviewProps) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getErrorRateColor = (rate: number): 'success' | 'warning' | 'error' => {
    if (rate < 1) return 'success';
    if (rate < 5) return 'warning';
    return 'error';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Average Response Time"
        value={formatDuration(metrics.avgResponseTime)}
        icon={<Clock className="w-4 h-4" />}
        color="info"
      />
      
      <MetricCard
        title="Peak Response Time"
        value={formatDuration(metrics.maxResponseTime)}
        icon={<TrendingUp className="w-4 h-4" />}
        color="warning"
      />
      
      <MetricCard
        title="Throughput"
        value={`${metrics.throughput.toFixed(1)}/s`}
        icon={<Zap className="w-4 h-4" />}
        color="success"
      />
      
      <MetricCard
        title="Transactions Per Second"
        value={`${metrics.transactionsPerSecond.toFixed(1)} TPS`}
        icon={<Activity className="w-4 h-4" />}
        color="success"
      />
      
      <MetricCard
        title="Error Rate"
        value={`${metrics.errorRate.toFixed(2)}%`}
        icon={<AlertTriangle className="w-4 h-4" />}
        color={getErrorRateColor(metrics.errorRate)}
      />
      
      <MetricCard
        title="90th Percentile"
        value={formatDuration(metrics.p90ResponseTime)}
        icon={<Gauge className="w-4 h-4" />}
        color="warning"
      />
      
      <MetricCard
        title="99th Percentile"
        value={formatDuration(metrics.p99ResponseTime)}
        icon={<Gauge className="w-4 h-4" />}
        color="error"
      />
      
      <MetricCard
        title="Test Duration"
        value={`${metrics.testDuration.toFixed(1)}s`}
        icon={<Timer className="w-4 h-4" />}
        color="info"
      />
    </div>
  );
};