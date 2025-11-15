import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onUpload: (data: any[]) => void;
}

export const FileUploader = ({ onUpload }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Archivo no válido",
        description: "Por favor, sube un archivo Excel (.xlsx, .xls) o CSV",
        variant: "destructive",
      });
      return;
    }

    setFile(file);
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        onUpload(jsonData);
        
        toast({
          title: "Archivo procesado",
          description: `Se procesaron ${jsonData.length} registros exitosamente`,
        });
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          title: "Error al procesar",
          description: "No se pudo leer el archivo. Verifica el formato.",
          variant: "destructive",
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <Card>
      <CardContent className="p-8">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-border hover:border-primary/50'
            }
          `}
        >
          {!file ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Arrastra tu archivo aquí
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                o haz clic para seleccionar
              </p>
              <label htmlFor="file-upload">
                <Button asChild>
                  <span className="cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Seleccionar Archivo
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
              />
              <p className="text-xs text-muted-foreground mt-4">
                Formatos soportados: Excel (.xlsx, .xls) y CSV
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between bg-accent rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
