import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service, analysisType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing gloss for service:', service.codigoServicio);

    let systemPrompt = '';
    let userPrompt = '';

    if (analysisType === 'gloss') {
      systemPrompt = `Eres un experto auditor médico especializado en análisis de glosas de facturas del sistema de salud colombiano. 
Tu tarea es analizar glosas y determinar si son procedentes o no, basándote en normatividad vigente, pertinencia clínica y evidencia médica.`;

      userPrompt = `Analiza la siguiente glosa:

Servicio: ${service.nombreServicio}
Código: ${service.codigoServicio}
Valor del servicio: $${service.valorServicio.toLocaleString('es-CO')}
Valor glosado: $${service.valorGlosa.toLocaleString('es-CO')}
Motivo de glosa: ${service.comentario || 'No especificado'}
Código concepto: ${service.codigoConcepto}
Responsable: ${service.codigoResponsable}

Realiza un análisis detallado considerando:
1. Pertinencia clínica del servicio
2. Validez del motivo de glosa
3. Normatividad aplicable
4. Recomendación de aceptar, rechazar o aceptar parcialmente

Responde en formato estructurado con:
- Análisis de pertinencia
- Decisión (rechazar/aceptar/aceptar_parcial)
- Argumentación técnica y normativa
- Valor a aceptar (si es aceptación parcial)`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: analysisText,
        service: service
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-gloss function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
