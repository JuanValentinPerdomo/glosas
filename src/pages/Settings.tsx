import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Webhook } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem('n8n_webhook_url');
    if (stored) setWebhookUrl(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('n8n_webhook_url', webhookUrl);
    toast({
      title: "Configuración guardada",
      description: "La URL del webhook se guardó correctamente",
    });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Configuración</h2>
          <p className="text-muted-foreground mt-1">
            Configura la integración con n8n y otras opciones
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Integración n8n</CardTitle>
                <CardDescription>
                  Configura el webhook para enviar y recibir datos desde n8n
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook">URL del Webhook n8n</Label>
              <Input
                id="webhook"
                type="url"
                placeholder="https://tu-n8n.com/webhook/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Esta URL será usada para enviar las respuestas generadas a n8n
              </p>
            </div>

            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versión:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backend:</span>
              <span className="font-medium">Lovable Cloud + IA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modelo IA:</span>
              <span className="font-medium">Gemini 2.5 Flash</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
