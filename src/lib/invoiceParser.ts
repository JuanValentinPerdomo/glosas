import { InvoiceService, InvoiceSummary } from "@/types/invoice";

export const parseInvoiceData = (data: any[]): InvoiceSummary[] => {
  const invoiceMap = new Map<string, InvoiceSummary>();

  data.forEach((row) => {
    // Skip empty rows or header rows
    if (!row.Factura || row.Factura.startsWith('Factura:')) return;

    const service: InvoiceService = {
      codigoDetalle: row.CodigoDetalle || '',
      codigoQX: row.CodigoQX || '',
      factura: row.Factura || '',
      saldoFactura: parseMoneyValue(row['Saldo Factura']),
      cc: row['C.C'] || '',
      codigoServicio: row.CodigoServicio || '',
      nombreServicio: row.NombreServicio || '',
      valorServicio: parseMoneyValue(row.ValorServicio),
      valorUnitario: parseMoneyValue(row.ValorUnitario),
      cantidad: parseInt(row.Cantidad) || 0,
      valor: parseMoneyValue(row.Valor),
      valorPaciente: parseMoneyValue(row.ValorPaciente),
      valorEntidad: parseMoneyValue(row.ValorEntidad),
      valorGlosa: parseMoneyValue(row.ValorGlosa),
      codigoConcepto: row.CodigoConcepto || '',
      codigoResponsable: row.CodigoResponsable || '',
      comentario: row.Comentario || '',
    };

    const invoiceNumber = service.factura;
    
    if (!invoiceMap.has(invoiceNumber)) {
      invoiceMap.set(invoiceNumber, {
        factura: invoiceNumber,
        saldoFactura: service.saldoFactura,
        totalServicios: 0,
        serviciosGlosados: 0,
        valorTotalGlosado: 0,
        servicios: [],
        fuente: 'manual',
        fechaCarga: new Date().toISOString(),
      });
    }

    const invoice = invoiceMap.get(invoiceNumber)!;
    invoice.servicios.push(service);
    invoice.totalServicios++;
    
    if (service.valorGlosa > 0) {
      invoice.serviciosGlosados++;
      invoice.valorTotalGlosado += service.valorGlosa;
    }
  });

  return Array.from(invoiceMap.values());
};

const parseMoneyValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove $ and commas, then parse
    const cleaned = value.replace(/[$,]/g, '').trim();
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

export const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
