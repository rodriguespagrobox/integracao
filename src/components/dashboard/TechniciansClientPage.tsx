'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, User, CircleCheck, BarChart3, Wrench } from "lucide-react";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { addDays, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ServiceOrder, Customer } from '@/lib/tiny-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { TechnicianReport } from '../reports/TechnicianReport';

interface TechnicianPerformanceClientPageProps {
  initialOrders: ServiceOrder[];
  initialCustomers: Customer[];
  fetchError: string | null;
}

const getStatusVariant = (status: ServiceOrder['situacao']) => {
  switch (status) {
    case "Em Andamento": return "bg-blue-500";
    case "Concluído": case "Aprovada": return "bg-green-600";
    case "Em Aberto": case "Orçada": return "bg-yellow-500";
    case "Cancelada": case "Não Aprovada": return "bg-red-500";
    default: return "bg-gray-500";
  }
};


export function TechnicianPerformanceClientPage({ initialOrders, initialCustomers, fetchError: initialError }: TechnicianPerformanceClientPageProps) {
  const [orders, setOrders] = useState<ServiceOrder[]>(initialOrders);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [fetchError, setFetchError] = useState<string | null>(initialError);
  
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const technicians = useMemo(() => {
    const allTechnicians = orders.map(o => o.tecnico).filter(Boolean);
    return ['all', ...Array.from(new Set(allTechnicians))];
  }, [orders]);

  const filteredData = useMemo(() => {
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const isInDateRange = dateRange?.from && dateRange.to ? 
        orderDate >= dateRange.from && orderDate <= dateRange.to : true;
      const matchesTechnician = selectedTechnician === 'all' || order.tecnico === selectedTechnician;
      return isInDateRange && matchesTechnician;
    });

    const totalOs = filteredOrders.length;
    const totalConcluido = filteredOrders.filter(o => o.situacao === 'Concluído').length;
    const totalMaoDeObra = filteredOrders.reduce((sum, o) => sum + (o.valorMaoDeObra || 0), 0);
    const customerMap = new Map(customers.map(c => [c.id, c]));
    
    const ordersWithCustomer = filteredOrders.map(order => ({
        ...order,
        cliente: customerMap.get(order.clienteId) || { nome: 'Cliente não encontrado' }
    }));


    return { totalOs, totalConcluido, totalMaoDeObra, orders: ordersWithCustomer };
  }, [orders, customers, dateRange, selectedTechnician]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">
            Desempenho dos Técnicos
            </h1>
            <p className="text-muted-foreground">
            Analise e exporte relatórios de ordens de serviço por técnico.
            </p>
        </div>
         <TechnicianReport 
            technicianName={selectedTechnician === 'all' ? 'Todos' : selectedTechnician}
            orders={filteredData.orders}
            dateRange={dateRange}
        />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filtros do Relatório</CardTitle>
          <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className='w-full md:w-[240px]'>
                    <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Técnicos</SelectItem>
                    {technicians.filter(t => t !== 'all').map(tech => (
                        <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>
      
       {fetchError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Dados</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{filteredData.totalOs}</div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OS Concluídas</CardTitle>
                <CircleCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{filteredData.totalConcluido}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento (M.O.)</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{filteredData.totalMaoDeObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
            <CardTitle>Ordens de Serviço Atribuídas</CardTitle>
            <CardDescription>Lista de OS para o técnico e período selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>OS ID</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead className='text-right'>Valor M.O.</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.orders.length > 0 ? (
                        filteredData.orders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className='font-medium'>#{order.id}</TableCell>
                                <TableCell>{order.cliente.nome}</TableCell>
                                <TableCell>{format(new Date(order.data), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusVariant(order.situacao)}>{order.situacao}</Badge>
                                </TableCell>
                                <TableCell className='text-right'>{order.valorMaoDeObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">Nenhuma ordem de serviço encontrada.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
