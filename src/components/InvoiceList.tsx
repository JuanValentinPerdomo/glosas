import { InvoiceSummary } from "@/types/invoice";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, AlertCircle } from "lucide-react";
import { formatMoney } from "@/lib/invoiceParser";
import { Link } from "react-router-dom";

interface InvoiceListProps {
  invoices: InvoiceSummary[];
}

export const InvoiceList = ({ invoices }: InvoiceListProps) => {
  return (
    <div className="grid gap-4">
      {invoices.map((invoice) => (
        <Card key={invoice.factura} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Factura {invoice.factura}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Saldo: {formatMoney(invoice.saldoFactura)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Servicios</p>
                    <p className="text-lg font-semibold text-foreground">
                      {invoice.totalServicios}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Glosados</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-danger">
                        {invoice.serviciosGlosados}
                      </p>
                      {invoice.serviciosGlosados > 0 && (
                        <AlertCircle className="w-4 h-4 text-danger" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Valor Glosado</p>
                    <p className="text-lg font-semibold text-danger">
                      {formatMoney(invoice.valorTotalGlosado)}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Fuente</p>
                    <Badge variant={invoice.fuente === 'n8n' ? 'default' : 'secondary'}>
                      {invoice.fuente === 'n8n' ? 'N8N' : 'Manual'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Link to={`/invoice/${invoice.factura}`}>
                <Button size="sm" className="ml-4">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalle
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
