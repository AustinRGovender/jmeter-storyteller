import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartDataPoint {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errors: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
  title: string;
  type: 'response-time' | 'throughput' | 'errors';
}

export const PerformanceChart = ({ data, title, type }: PerformanceChartProps) => {
  const getColor = () => {
    switch (type) {
      case 'response-time':
        return 'hsl(var(--info))';
      case 'throughput':
        return 'hsl(var(--success))';
      case 'errors':
        return 'hsl(var(--error))';
      default:
        return 'hsl(var(--primary))';
    }
  };

  const getDataKey = () => {
    switch (type) {
      case 'response-time':
        return 'responseTime';
      case 'throughput':
        return 'throughput';
      case 'errors':
        return 'errors';
      default:
        return 'responseTime';
    }
  };

  const formatValue = (value: number) => {
    switch (type) {
      case 'response-time':
        return `${value.toFixed(0)}ms`;
      case 'throughput':
        return `${value.toFixed(1)}/s`;
      case 'errors':
        return value.toString();
      default:
        return value.toString();
    }
  };

  const ChartComponent = type === 'errors' ? BarChart : LineChart;

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
            <XAxis 
              dataKey="timestamp" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
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
            {type === 'errors' ? (
              <Bar 
                dataKey={getDataKey()} 
                fill={getColor()}
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <Line 
                type="monotone" 
                dataKey={getDataKey()} 
                stroke={getColor()}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: getColor() }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};