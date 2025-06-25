'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  Wrench,
  Users,
  CircleCheck,
  PlusCircle,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { ServiceOrder } from '@/lib/tiny-service';

interface DashboardClientPageProps {
  initialOrders: ServiceOrder[];
  fetchError: string | null;
}

export function DashboardClientPage({ initialOrders, fetchError: initialError }: DashboardClientPageProps) {
  const [orders] = useState<ServiceOrder[]>(initialOrders);
  const [fetchError] = useState<string | null>(initialError);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [technicianFilter, setTechnicianFilter] = useState('all');

  const technicians = useMemo(() => Array.from(new Set(orders.map(o => o.tecnico).filter(Boolean))), [orders]);

  const filteredData = useMemo(() => {
    const filteredOrders = orders.filter(order => {
      if (!order.data) return false;
      const orderDate = new Date(order.data);
      const isInDateRange = dateRange?.from && dateRange.to ? 
        orderDate >= dateRange.from && orderDate <= dateRange.to : true;
      const matchesTechnician = technicianFilter === 'all' || order.tecnico === technicianFilter;
      return isInDateRange && matchesTechnician;
    });

    const totalOs = filteredOrders.length;
    const totalConcluido = filteredOrders.filter(o => o.situacao === 'Concluído').length;
    const totalMaoDeObra = filteredOrders.reduce((sum, o) => sum + (o.valorMaoDeObra || 0), 0);
    const totalClientes = new Set(filteredOrders.map(o => o.clienteId)).size;

    return { totalOs, totalConcluido, totalMaoDeObra, totalClientes };
  }, [orders, dateRange, technicianFilter]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Painel de Controle
        </h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio na AGROBOX LAB.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filtros do Painel</CardTitle>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Técnicos</SelectItem>
                {technicians.map(tech => <SelectItem key={tech} value={tech}>{tech}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {fetchError && (
        <Alert variant="destructive">
          <Wrench className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Dados</AlertTitle>
          <AlertDescription>
            {fetchError} Se o problema persistir, tente se conectar novamente na página de{" "}
            <Link href="/dashboard/integracao" className="underline font-bold">
              Integração
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.totalOs}</div>
            <p className="text-xs text-muted-foreground">
              Ordens no período selecionado.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OS Concluídas</CardTitle>
            <CircleCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.totalConcluido}</div>
            <p className="text-xs text-muted-foreground">
              Ordens concluídas no período.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento (M.O.)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredData.totalMaoDeObra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma da mão de obra no período.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Atendidos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.totalClientes}</div>
            <p className="text-xs text-muted-foreground">
              Clientes únicos no período.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button asChild variant="outline" size="lg" className="justify-start p-6 text-left h-auto group">
             <Link href="/dashboard/ordens/nova">
              <div className="flex items-start">
                <PlusCircle className="h-8 w-8 mr-4 text-primary" />
                <div>
                  <p className="font-bold">Nova Ordem de Serviço</p>
                  <p className="text-sm text-muted-foreground">Crie uma nova OS para um cliente.</p>
                </div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="justify-start p-6 text-left h-auto group">
            <Link href="/dashboard/clientes/novo">
              <div className="flex items-start">
                <Users className="h-8 w-8 mr-4 text-primary" />
                <div>
                  <p className="font-bold">Novo Cliente</p>
                  <p className="text-sm text-muted-foreground">Cadastre um novo cliente na base.</p>
                </div>
              </div>
            </Link>
          </Button>
           <Button asChild variant="outline" size="lg" className="justify-start p-6 text-left h-auto group">
            <Link href="/dashboard/tecnicos">
              <div className="flex items-start">
                <FileDown className="h-8 w-8 mr-4 text-primary" />
                <div>
                  <p className="font-bold">Relatórios</p>
                  <p className="text-sm text-muted-foreground">Exporte relatórios de desempenho.</p>
                </div>
              </div>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
