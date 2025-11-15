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
    const { invoice, glosses } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating response for invoice:', invoice.factura);

    const glossDetails = glosses.map((g: any, idx: number) => `
== GLOSA ${idx + 1} ==
Servicio: ${g.nombreServicio}
Código: ${g.codigoServicio}
Valor glosado: $${g.valorGlosa.toLocaleString('es-CO')}
Motivo: ${g.comentario}
Análisis: ${g.analisisPertinencia || 'Pendiente'}
Decisión: ${g.decision || 'Pendiente'}
Argumentación: ${g.argumentacion || 'Pendiente'}
`).join('\n');

    const systemPrompt = `Eres un experto en redacción de respuestas formales a glosas de EPS en el sistema de salud colombiano. 
Tu tarea es generar una carta formal, técnica y profesional que responda a las glosas presentadas, con argumentación clínica y normativa sólida.`;

    const userPrompt = `Genera una carta formal de respuesta a glosas para la siguiente factura:

INFORMACIÓN DE LA FACTURA:
- Número: ${invoice.factura}
- Saldo: $${invoice.saldoFactura.toLocaleString('es-CO')}
- Total servicios: ${invoice.totalServicios}
- Servicios glosados: ${invoice.serviciosGlosados}
- Valor total glosado: $${invoice.valorTotalGlosado.toLocaleString('es-CO')}

DETALLE DE GLOSAS:
${glossDetails}

La carta debe incluir:
1. Encabezado formal con datos de la IPS
2. Introducción contextualizando la respuesta
3. Análisis detallado de cada glosa con argumentación técnica y normativa
4. Solicitud formal de levantamiento de glosas procedentes
5. Cierre profesional

Usa un tono formal, técnico y respetuoso. Incluye referencias normativas cuando sea pertinente.`;

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
    const letter = data.choices[0].message.content;

    console.log('Response letter generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        letter: letter,
        invoice: invoice
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-response function:', error);
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
