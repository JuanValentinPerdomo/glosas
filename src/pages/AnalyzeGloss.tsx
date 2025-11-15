import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { InvoiceSummary, InvoiceService, GlossAnalysis } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { formatMoney } from "@/lib/invoiceParser";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AnalyzeGloss() {
  const { invoiceNumber, serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [service, setService] = useState<InvoiceService | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [decision, setDecision] = useState<'rechazar' | 'aceptar' | 'aceptar_parcial'>('rechazar');
  const [argumentation, setArgumentation] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('invoices');
    if (stored) {
      const invoices: InvoiceSummary[] = JSON.parse(stored);
      const invoice = invoices.find(inv => inv.factura === invoiceNumber);
      if (invoice) {
        const foundService = invoice.servicios.find(s => s.codigoDetalle === serviceId);
        setService(foundService || null);
      }
    }
  }, [invoiceNumber, serviceId]);

  const handleAnalyze = async () => {
    if (!service) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-gloss', {
        body: { 
          service: service,
          analysisType: 'gloss'
        }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        
        // Try to parse decision from analysis
        const lowerAnalysis = data.analysis.toLowerCase();
        if (lowerAnalysis.includes('rechazar') || lowerAnalysis.includes('improcedente')) {
          setDecision('rechazar');
        } else if (lowerAnalysis.includes('aceptar parcial')) {
          setDecision('aceptar_parcial');
        } else if (lowerAnalysis.includes('aceptar') || lowerAnalysis.includes('procedente')) {
          setDecision('aceptar');
        }
        
        setArgumentation(data.analysis);

        toast({
          title: "Análisis completado",
          description: "La IA ha analizado la glosa exitosamente",
        });
      }
    } catch (error) {
      console.error('Error analyzing gloss:', error);
      toast({
        title: "Error",
        description: "No se pudo analizar la glosa. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!service) return;

    const glossAnalysis: GlossAnalysis = {
      codigoServicio: service.codigoServicio,
      nombreServicio: service.nombreServicio,
      valorServicio: service.valorServicio,
      valorGlosa: service.valorGlosa,
      comentario: service.comentario,
      codigoConcepto: service.codigoConcepto,
      codigoResponsable: service.codigoResponsable,
      analisisPertinencia: analysis,
      decision: decision,
      argumentacion: argumentation,
    };

    // Save to localStorage
    const key = `analysis_${invoiceNumber}_${serviceId}`;
    localStorage.setItem(key, JSON.stringify(glossAnalysis));

    toast({
      title: "Análisis guardado",
      description: "El análisis se guardó correctamente",
    });

    navigate(`/invoice/${invoiceNumber}`);
  };

  if (!service) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Servicio no encontrado</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
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
            <CardTitle className="text-2xl">Análisis de Glosa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Código Servicio</p>
                <p className="font-mono font-semibold">{service.codigoServicio}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Glosado</p>
                <p className="font-semibold text-danger text-lg">
                  {formatMoney(service.valorGlosa)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Servicio</p>
              <p className="font-medium">{service.nombreServicio}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Motivo de Glosa</p>
              <p className="text-sm">{service.comentario || 'No especificado'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Código Concepto</p>
              <p className="text-sm font-mono">{service.codigoConcepto}</p>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analizar con IA
                </>
              )}
            </Button>

            {analysis && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Análisis y Argumentación
                  </label>
                  <Textarea
                    value={argumentation}
                    onChange={(e) => setArgumentation(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Decisión
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={decision === 'rechazar' ? 'default' : 'outline'}
                      onClick={() => setDecision('rechazar')}
                      className={decision === 'rechazar' ? 'bg-danger hover:bg-danger/90' : ''}
                    >
                      Rechazar
                    </Button>
                    <Button
                      variant={decision === 'aceptar_parcial' ? 'default' : 'outline'}
                      onClick={() => setDecision('aceptar_parcial')}
                      className={decision === 'aceptar_parcial' ? 'bg-warning hover:bg-warning/90' : ''}
                    >
                      Aceptar Parcial
                    </Button>
                    <Button
                      variant={decision === 'aceptar' ? 'default' : 'outline'}
                      onClick={() => setDecision('aceptar')}
                      className={decision === 'aceptar' ? 'bg-success hover:bg-success/90' : ''}
                    >
                      Aceptar
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full" size="lg">
                  Guardar Análisis
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
