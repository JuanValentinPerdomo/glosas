import { Layout } from "@/components/Layout";
import { FileUploader } from "@/components/FileUploader";
import { parseInvoiceData } from "@/lib/invoiceParser";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { InvoiceSummary } from "@/types/invoice";

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpload = (data: any[]) => {
    try {
      const invoices = parseInvoiceData(data);
      
      // Save to localStorage
      const existing = localStorage.getItem('invoices');
      const existingInvoices: InvoiceSummary[] = existing ? JSON.parse(existing) : [];
      
      // Merge new invoices
      const merged = [...existingInvoices];
      invoices.forEach(newInv => {
        const existingIndex = merged.findIndex(inv => inv.factura === newInv.factura);
        if (existingIndex >= 0) {
          merged[existingIndex] = newInv;
        } else {
          merged.push(newInv);
        }
      });
      
      localStorage.setItem('invoices', JSON.stringify(merged));
      
      toast({
        title: "Facturas cargadas",
        description: `Se cargaron ${invoices.length} facturas correctamente`,
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error parsing invoices:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar las facturas",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Cargar Facturas</h2>
          <p className="text-muted-foreground mt-2">
            Sube un archivo Excel o CSV con las facturas a procesar
          </p>
        </div>

        <FileUploader onUpload={handleUpload} />

        <div className="bg-accent rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Formato del archivo</h3>
          <p className="text-sm text-muted-foreground">
            El archivo debe contener las siguientes columnas:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>CodigoDetalle, CodigoQX, Factura</li>
            <li>Saldo Factura, C.C, CodigoServicio</li>
            <li>NombreServicio, ValorServicio, Cantidad</li>
            <li>ValorGlosa (crítico para detectar glosas)</li>
            <li>CodigoConcepto, CodigoResponsable, Comentario</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
