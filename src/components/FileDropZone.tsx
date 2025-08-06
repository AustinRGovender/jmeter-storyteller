import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FileDropZoneProps {
  onFileUpload: (file: File) => void;
}

export const FileDropZone = ({ onFileUpload }: FileDropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      const files = Array.from(e.dataTransfer.files);
      const jtlFile = files.find(file => 
        file.name.endsWith('.jtl') || file.type === 'text/plain'
      );
      
      if (jtlFile) {
        onFileUpload(jtlFile);
      }
    },
    [onFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  return (
    <Card 
      className={`relative p-8 border-2 border-dashed transition-all duration-300 hover:shadow-elegant ${
        isDragOver 
          ? 'border-primary bg-primary/5 shadow-glow' 
          : 'border-muted-foreground/25 hover:border-primary'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className={`p-4 rounded-full transition-colors ${
          isDragOver ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <Upload className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Drop your JMeter JTL file here
          </h3>
          <p className="text-muted-foreground">
            Or click to browse and select your performance test results
          </p>
        </div>

        <input
          type="file"
          accept=".jtl,text/plain"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>Supports .jtl files</span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-warning">
          <AlertCircle className="w-3 h-3" />
          <span>All processing happens in your browser - files never leave your device</span>
        </div>
      </div>
    </Card>
  );
};