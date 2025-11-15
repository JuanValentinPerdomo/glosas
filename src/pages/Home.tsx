import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { InvoiceList } from "@/components/InvoiceList";
import { InvoiceSummary } from "@/types/invoice";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Load invoices from localStorage
    const stored = localStorage.getItem('invoices');
    if (stored) {
      setInvoices(JSON.parse(stored));
    }
  }, []);

  const filteredInvoices = invoices.filter(invoice => 
    invoice.factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.serviciosGlosados > 0 && searchTerm.toLowerCase().includes('glosa')
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Facturas</h2>
            <p className="text-muted-foreground mt-1">
              Gestiona y analiza las facturas con glosas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de factura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredInvoices.length > 0 ? (
          <InvoiceList invoices={filteredInvoices} />
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay facturas cargadas
            </h3>
            <p className="text-muted-foreground">
              Carga tu primer archivo desde la sección de carga
            </p>
          </div>
        )}

        {invoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-card rounded-lg p-6 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Facturas</p>
              <p className="text-3xl font-bold text-foreground">{invoices.length}</p>
            </div>
            <div className="bg-danger-light rounded-lg p-6 border border-danger/20">
              <p className="text-sm text-danger mb-1">Servicios Glosados</p>
              <p className="text-3xl font-bold text-danger">
                {invoices.reduce((sum, inv) => sum + inv.serviciosGlosados, 0)}
              </p>
            </div>
            <div className="bg-warning-light rounded-lg p-6 border border-warning/20">
              <p className="text-sm text-warning mb-1">Valor Total Glosado</p>
              <p className="text-3xl font-bold text-warning">
                ${invoices.reduce((sum, inv) => sum + inv.valorTotalGlosado, 0).toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
