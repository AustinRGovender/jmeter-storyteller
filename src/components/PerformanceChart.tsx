import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartDataPoint {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errors: number;
  minResponseTime: number;
  maxResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
  avgConnectTime: number;
  avgLatency: number;
  bandwidth: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  title: string;
  type: 'response-time' | 'throughput' | 'errors' | 'percentiles' | 'min-max-avg' | 'success-rate' | 'bandwidth' | 'connect-latency';
}

export const PerformanceChart = ({ data, title, type }: PerformanceChartProps) => {
  const getColor = (dataKey?: string) => {
    switch (type) {
      case 'response-time':
        return 'hsl(var(--info))';
      case 'throughput':
        return 'hsl(var(--success))';
      case 'errors':
        return 'hsl(var(--error))';
      case 'percentiles':
        switch (dataKey) {
          case 'p90ResponseTime': return 'hsl(var(--info))';
          case 'p95ResponseTime': return 'hsl(var(--warning))';
          case 'p99ResponseTime': return 'hsl(var(--error))';
          default: return 'hsl(var(--primary))';
        }
      case 'success-rate':
        return 'hsl(var(--success))';
      case 'bandwidth':
        return 'hsl(var(--info))';
      case 'connect-latency':
        return dataKey === 'avgConnectTime' ? 'hsl(var(--warning))' : 'hsl(var(--info))';
      default:
        return 'hsl(var(--primary))';
    }
  };

  const formatValue = (value: number, dataKey?: string) => {
    switch (type) {
      case 'response-time':
      case 'percentiles':
      case 'connect-latency':
        return `${value.toFixed(0)}ms`;
      case 'throughput':
        return `${value.toFixed(1)}/s`;
      case 'errors':
        return value.toString();
      case 'success-rate':
        return `${value.toFixed(1)}%`;
      case 'bandwidth':
        return `${value.toFixed(1)} KB/s`;
      default:
        return value.toString();
    }
  };

  const renderChart = () => {
    switch (type) {
      case 'errors':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
            <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-elegant)'
              }}
              formatter={(value: number) => [formatValue(value), title]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="errors" fill={getColor()} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'percentiles':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
            <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-elegant)'
              }}
              formatter={(value: number, name: string) => [formatValue(value), name]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line type="monotone" dataKey="p90ResponseTime" stroke={getColor('p90ResponseTime')} strokeWidth={2} dot={false} name="90th Percentile" />
            <Line type="monotone" dataKey="p95ResponseTime" stroke={getColor('p95ResponseTime')} strokeWidth={2} dot={false} name="95th Percentile" />
            <Line type="monotone" dataKey="p99ResponseTime" stroke={getColor('p99ResponseTime')} strokeWidth={2} dot={false} name="99th Percentile" />
          </LineChart>
        );

      case 'min-max-avg':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
            <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-elegant)'
              }}
              formatter={(value: number, name: string) => [formatValue(value), name]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area type="monotone" dataKey="maxResponseTime" stackId="1" stroke="hsl(var(--error))" fill="hsl(var(--error) / 0.3)" name="Max Response Time" />
            <Area type="monotone" dataKey="responseTime" stackId="2" stroke="hsl(var(--info))" fill="hsl(var(--info) / 0.5)" name="Avg Response Time" />
            <Area type="monotone" dataKey="minResponseTime" stackId="3" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.3)" name="Min Response Time" />
          </AreaChart>
        );

      case 'connect-latency':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
            <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-elegant)'
              }}
              formatter={(value: number, name: string) => [formatValue(value), name]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line type="monotone" dataKey="avgConnectTime" stroke={getColor('avgConnectTime')} strokeWidth={2} dot={false} name="Connect Time" />
            <Line type="monotone" dataKey="avgLatency" stroke={getColor('avgLatency')} strokeWidth={2} dot={false} name="Latency" />
          </LineChart>
        );

      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
            <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-elegant)'
              }}
              formatter={(value: number) => [formatValue(value), title]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Line 
              type="monotone" 
              dataKey={type === 'response-time' ? 'responseTime' : type === 'throughput' ? 'throughput' : type === 'success-rate' ? 'successRate' : type === 'bandwidth' ? 'bandwidth' : 'responseTime'} 
              stroke={getColor()} 
              strokeWidth={2} 
              dot={false} 
              activeDot={{ r: 6, fill: getColor() }} 
            />
          </LineChart>
        );
    }
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};