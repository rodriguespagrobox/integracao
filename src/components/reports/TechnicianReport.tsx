'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Order = {
  id: string;
  cliente: { nome: string };
  equipamento: string;
  data: string;
  situacao: string;
  valorMaoDeObra: number;
};

interface TechnicianReportProps {
  technicianName: string;
  orders: Order[];
  dateRange: DateRange | undefined;
}

export function TechnicianReport({ technicianName, orders, dateRange }: TechnicianReportProps) {
  
  const generatePdf = () => {
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(20);
    doc.text('AGROBOX LAB - Relatório de Desempenho', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Técnico: ${technicianName}`, 14, 32);

    const dateText = dateRange?.from ? 
      (dateRange.to ? 
        `Período: ${format(dateRange.from, "dd/MM/yyyy", {locale: ptBR})} a ${format(dateRange.to, "dd/MM/yyyy", {locale: ptBR})}` : 
        `Data: ${format(dateRange.from, "dd/MM/yyyy", {locale: ptBR})}`) : 
      'Período: Todos';
    doc.text(dateText, 14, 38);

    const tableColumn = ["OS ID", "Cliente", "Equipamento", "Data", "Situação", "Valor M.O."];
    const tableRows: (string | number)[][] = [];

    orders.forEach(order => {
      const orderData = [
        `#${order.id}`,
        order.cliente.nome,
        order.equipamento,
        format(new Date(order.data), "dd/MM/yyyy"),
        order.situacao,
        order.valorMaoDeObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
      tableRows.push(orderData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] },
    });

    // Rodapé com totais
    const finalY = (doc as any).lastAutoTable.finalY;
    const totalOs = orders.length;
    const totalMaoDeObra = orders.reduce((sum, order) => sum + order.valorMaoDeObra, 0);

    doc.setFontSize(12);
    doc.text('Resumo do Período', 14, finalY + 10);
    doc.setFontSize(10);
    doc.text(`Total de Ordens de Serviço: ${totalOs}`, 14, finalY + 16);
    doc.text(`Faturamento Total (Mão de Obra): ${totalMaoDeObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, finalY + 22);

    doc.save(`relatorio_${technicianName.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <Button onClick={generatePdf} disabled={orders.length === 0}>
      <FileDown className="mr-2 h-4 w-4" />
      Exportar PDF
    </Button>
  );
}
