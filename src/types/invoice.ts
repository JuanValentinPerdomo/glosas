export interface InvoiceService {
  codigoDetalle: string;
  codigoQX: string;
  factura: string;
  saldoFactura: number;
  cc: string;
  codigoServicio: string;
  nombreServicio: string;
  valorServicio: number;
  valorUnitario: number;
  cantidad: number;
  valor: number;
  valorPaciente: number;
  valorEntidad: number;
  valorGlosa: number;
  codigoConcepto: string;
  codigoResponsable: string;
  comentario: string;
}

export interface InvoiceSummary {
  factura: string;
  saldoFactura: number;
  totalServicios: number;
  serviciosGlosados: number;
  valorTotalGlosado: number;
  servicios: InvoiceService[];
  fuente: 'manual' | 'n8n';
  fechaCarga: string;
}

export interface GlossAnalysis {
  codigoServicio: string;
  nombreServicio: string;
  valorServicio: number;
  valorGlosa: number;
  comentario: string;
  codigoConcepto: string;
  codigoResponsable: string;
  analisisPertinencia: string;
  decision: 'rechazar' | 'aceptar' | 'aceptar_parcial';
  argumentacion: string;
  valorAceptado?: number;
}

export interface ResponseData {
  factura: string;
  valorTotalGlosado: number;
  valorAceptado: number;
  valorRechazado: number;
  glosas: GlossAnalysis[];
  cartaFinal: string;
}
