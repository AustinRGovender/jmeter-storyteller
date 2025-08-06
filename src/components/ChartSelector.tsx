import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Settings, Eye, EyeOff } from "lucide-react";

export interface ChartConfig {
  id: string;
  title: string;
  type: string;
  category: string;
  enabled: boolean;
}

interface ChartSelectorProps {
  charts: ChartConfig[];
  onChartsChange: (charts: ChartConfig[]) => void;
}

export const ChartSelector = ({ charts, onChartsChange }: ChartSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Load saved preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chartPreferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        const updatedCharts = charts.map(chart => ({
          ...chart,
          enabled: preferences[chart.id] !== undefined ? preferences[chart.id] : chart.enabled
        }));
        onChartsChange(updatedCharts);
      } catch (error) {
        console.error('Error loading chart preferences:', error);
      }
    }
  }, []);

  const handleChartToggle = (chartId: string, enabled: boolean) => {
    const updatedCharts = charts.map(chart =>
      chart.id === chartId ? { ...chart, enabled } : chart
    );
    onChartsChange(updatedCharts);

    // Save to localStorage
    const preferences = updatedCharts.reduce((acc, chart) => {
      acc[chart.id] = chart.enabled;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem('chartPreferences', JSON.stringify(preferences));
  };

  const handleSelectAll = (category: string, enabled: boolean) => {
    const updatedCharts = charts.map(chart =>
      chart.category === category ? { ...chart, enabled } : chart
    );
    onChartsChange(updatedCharts);

    // Save to localStorage
    const preferences = updatedCharts.reduce((acc, chart) => {
      acc[chart.id] = chart.enabled;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem('chartPreferences', JSON.stringify(preferences));
  };

  const categories = [...new Set(charts.map(chart => chart.category))];
  const enabledCount = charts.filter(chart => chart.enabled).length;

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Chart Selection
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2"
          >
            {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {enabledCount} of {charts.length} charts
          </Button>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0">
          <div className="space-y-6">
            {categories.map(category => {
              const categoryCharts = charts.filter(chart => chart.category === category);
              const enabledInCategory = categoryCharts.filter(chart => chart.enabled).length;
              const allEnabled = enabledInCategory === categoryCharts.length;
              const someEnabled = enabledInCategory > 0 && enabledInCategory < categoryCharts.length;
              
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">{category}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAll(category, true)}
                        disabled={allEnabled}
                        className="text-xs"
                      >
                        All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAll(category, false)}
                        disabled={enabledInCategory === 0}
                        className="text-xs"
                      >
                        None
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryCharts.map(chart => (
                      <div key={chart.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={chart.id}
                          checked={chart.enabled}
                          onCheckedChange={(checked) => 
                            handleChartToggle(chart.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={chart.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {chart.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};