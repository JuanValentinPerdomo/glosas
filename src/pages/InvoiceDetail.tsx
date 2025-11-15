import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { InvoiceSummary, InvoiceService } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatMoney } from "@/lib/invoiceParser";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InvoiceDetail() {
  const { invoiceNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('invoices');
    if (stored) {
      const invoices: InvoiceSummary[] = JSON.parse(stored);
      const found = invoices.find(inv => inv.factura === invoiceNumber);
      setInvoice(found || null);
    }
  }, [invoiceNumber]);

  if (!invoice) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Factura no encontrada</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Volver al inicio
          </Button>
        </div>
      </Layout>
    );
  }

  const handleGenerateResponse = async () => {
    if (!invoice) return;

    const glossedServices = invoice.servicios.filter(service => service.valorGlosa > 0);
    
    if (glossedServices.length === 0) {
      toast({
        title: "Sin glosas",
        description: "No hay servicios glosados para procesar",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Preparar datos para el Excel
      const excelData = glossedServices.map(service => ({
        CodigoDetalle: service.codigoDetalle,
        CodigoQX: service.codigoQX,
        Factura: service.factura,
        'Saldo Factura': service.saldoFactura,
        'C.C': service.cc,
        CodigoServicio: service.codigoServicio,
        NombreServicio: service.nombreServicio,
        ValorServicio: service.valorServicio,
        ValorUnitario: service.valorUnitario,
        Cantidad: service.cantidad,
        Valor: service.valor,
        ValorPaciente: service.valorPaciente,
        ValorEntidad: service.valorEntidad,
        ValorGlosa: service.valorGlosa,
        CodigoConcepto: service.codigoConcepto,
        CodigoResponsable: service.codigoResponsable,
        Comentario: service.comentario,
      }));

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, "Servicios Glosados");

      // Convertir a blob
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Crear FormData y enviar a n8n
      const formData = new FormData();
      formData.append('file', blob, `glosas_${invoice.factura}.xlsx`);

      const response = await fetch('http://localhost:5678/webhook-test/excel-upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Archivo Excel enviado a n8n correctamente",
        });
      } else {
        throw new Error('Error al enviar el archivo');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el archivo a n8n",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Factura {invoice.factura}</CardTitle>
                  <p className="text-muted-foreground">
                    Saldo: {formatMoney(invoice.saldoFactura)}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleGenerateResponse}
                disabled={isGenerating || invoice.serviciosGlosados === 0}
              >
                {isGenerating ? "Generando..." : "Generar Respuesta con IA"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Servicios</p>
                <p className="text-2xl font-bold text-foreground">{invoice.totalServicios}</p>
              </div>
              <div className="bg-danger-light rounded-lg p-4">
                <p className="text-sm text-danger mb-1">Glosados</p>
                <p className="text-2xl font-bold text-danger">{invoice.serviciosGlosados}</p>
              </div>
              <div className="bg-warning-light rounded-lg p-4">
                <p className="text-sm text-warning mb-1">Valor Glosado</p>
                <p className="text-2xl font-bold text-warning">
                  {formatMoney(invoice.valorTotalGlosado)}
                </p>
              </div>
              <div className="bg-success-light rounded-lg p-4">
                <p className="text-sm text-success mb-1">Sin Glosa</p>
                <p className="text-2xl font-bold text-success">
                  {invoice.totalServicios - invoice.serviciosGlosados}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios Glosados ({invoice.serviciosGlosados})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Mostrando solo servicios con glosa
            </p>
          </CardHeader>
          <CardContent>
            {invoice.serviciosGlosados === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
                <p className="text-lg font-medium text-foreground">No hay servicios glosados</p>
                <p className="text-sm text-muted-foreground">Esta factura no tiene glosas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Glosa</TableHead>
                    <TableHead>Comentario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.servicios
                    .filter(service => service.valorGlosa > 0)
                    .map((service) => (
                      <TableRow 
                        key={service.codigoDetalle}
                        className="bg-danger-light/30"
                      >
                        <TableCell className="font-mono text-sm">
                          {service.codigoServicio}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">{service.nombreServicio}</div>
                        </TableCell>
                        <TableCell>{service.cantidad}</TableCell>
                        <TableCell>{formatMoney(service.valor)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-danger" />
                            <span className="font-semibold text-danger">
                              {formatMoney(service.valorGlosa)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {service.comentario ? (
                            <Badge variant="outline" className="text-xs">
                              {service.comentario}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
