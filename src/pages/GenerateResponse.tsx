import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { InvoiceSummary, GlossAnalysis } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Copy, Download, Send } from "lucide-react";
import { formatMoney } from "@/lib/invoiceParser";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function GenerateResponse() {
  const { invoiceNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null);
  const [glosses, setGlosses] = useState<GlossAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [responseLetter, setResponseLetter] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('invoices');
    if (stored) {
      const invoices: InvoiceSummary[] = JSON.parse(stored);
      const found = invoices.find(inv => inv.factura === invoiceNumber);
      setInvoice(found || null);

      // Load all gloss analyses for this invoice
      if (found) {
        const analyses: GlossAnalysis[] = [];
        found.servicios.forEach(service => {
          if (service.valorGlosa > 0) {
            const key = `analysis_${invoiceNumber}_${service.codigoDetalle}`;
            const stored = localStorage.getItem(key);
            if (stored) {
              analyses.push(JSON.parse(stored));
            }
          }
        });
        setGlosses(analyses);
      }
    }
  }, [invoiceNumber]);

  const handleGenerate = async () => {
    if (!invoice) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-response', {
        body: { 
          invoice: invoice,
          glosses: glosses
        }
      });

      if (error) throw error;

      if (data.success) {
        setResponseLetter(data.letter);
        
        toast({
          title: "Respuesta generada",
          description: "La carta de respuesta ha sido generada exitosamente",
        });
      }
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la respuesta. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(responseLetter);
    toast({
      title: "Copiado",
      description: "La respuesta ha sido copiada al portapapeles",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([responseLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respuesta_${invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendToN8N = async () => {
    // This would send to n8n webhook
    const webhookUrl = localStorage.getItem('n8n_webhook_url');
    
    if (!webhookUrl) {
      toast({
        title: "Webhook no configurado",
        description: "Configura la URL del webhook de n8n en configuración",
        variant: "destructive",
      });
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factura: invoice?.factura,
          respuesta: responseLetter,
          glosasAnalizadas: glosses
        })
      });

      toast({
        title: "Enviado a n8n",
        description: "La respuesta ha sido enviada correctamente",
      });
    } catch (error) {
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar a n8n",
        variant: "destructive",
      });
    }
  };

  if (!invoice) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Factura no encontrada</p>
        </div>
      </Layout>
    );
  }

  const valorAceptado = glosses
    .filter(g => g.decision === 'aceptar')
    .reduce((sum, g) => sum + g.valorGlosa, 0);

  const valorRechazado = glosses
    .filter(g => g.decision === 'rechazar')
    .reduce((sum, g) => sum + g.valorGlosa, 0);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/invoice/${invoiceNumber}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Generar Respuesta - Factura {invoice.factura}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Valor Total Glosado</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatMoney(invoice.valorTotalGlosado)}
                </p>
              </div>
              <div className="bg-success-light rounded-lg p-4">
                <p className="text-sm text-success mb-1">Valor Aceptado</p>
                <p className="text-2xl font-bold text-success">
                  {formatMoney(valorAceptado)}
                </p>
              </div>
              <div className="bg-danger-light rounded-lg p-4">
                <p className="text-sm text-danger mb-1">Valor Rechazado</p>
                <p className="text-2xl font-bold text-danger">
                  {formatMoney(valorRechazado)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Glosas Analizadas: {glosses.length}</h3>
              {glosses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay glosas analizadas. Analiza las glosas antes de generar la respuesta.
                </p>
              ) : (
                <div className="space-y-2">
                  {glosses.map((gloss, idx) => (
                    <div key={idx} className="text-sm bg-accent p-3 rounded-lg">
                      <p className="font-medium">{gloss.nombreServicio}</p>
                      <p className="text-xs text-muted-foreground">
                        Decisión: {gloss.decision} | Valor: {formatMoney(gloss.valorGlosa)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading || glosses.length === 0}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generando respuesta...
                </>
              ) : (
                'Generar Respuesta con IA'
              )}
            </Button>

            {responseLetter && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Carta de Respuesta
                  </label>
                  <Textarea
                    value={responseLetter}
                    onChange={(e) => setResponseLetter(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                  <Button onClick={handleSendToN8N} variant="default" className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar a n8n
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
