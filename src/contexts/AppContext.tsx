import { createContext, useContext, useState, ReactNode } from "react";
import { JTLParser } from "@/utils/jtlParser";
import { toast } from "@/hooks/use-toast";

interface AppContextType {
  parser: JTLParser | null;
  fileName: string;
  isProcessing: boolean;
  handleFileUpload: (file: File) => Promise<void>;
  handleReset: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [parser, setParser] = useState<JTLParser | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    
    try {
      const content = await file.text();
      const newParser = new JTLParser();
      const parseResult = newParser.parseFile(content);
      
      if (!parseResult.success) {
        const debugInfo = parseResult.debugInfo;
        console.log('Parse failed. Debug info:', debugInfo);
        
        toast({
          title: "Invalid File",
          description: parseResult.error || "No valid performance data found in the uploaded file.",
          variant: "destructive",
        });
        
        // Show detailed debug information in console
        console.log(`File parsing details:
          - Total lines: ${debugInfo.totalLines}
          - Header: ${debugInfo.headerLine}
          - Detected delimiter: "${debugInfo.detectedDelimiter}"
          - Detected headers: ${debugInfo.detectedHeaders.join(', ')}
          - Parsed records: ${debugInfo.parsedRecords}
          - Valid records: ${debugInfo.validRecords}
          - Sample record:`, debugInfo.sampleRecord);
        
        setIsProcessing(false);
        return;
      }
      
      setParser(newParser);
      toast({
        title: "File Processed Successfully",
        description: `Loaded ${parseResult.records.length.toLocaleString()} performance records from ${file.name}`,
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process the JTL file. Please ensure it's a valid JMeter results file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setParser(null);
    setFileName("");
    setIsProcessing(false);
    toast({
      title: "Reset Complete",
      description: "You can now upload a new JTL file",
    });
  };

  return (
    <AppContext.Provider
      value={{
        parser,
        fileName,
        isProcessing,
        handleFileUpload,
        handleReset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};