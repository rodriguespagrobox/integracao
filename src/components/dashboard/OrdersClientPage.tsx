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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, AlertTriangle, RefreshCw, Search, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { syncData } from "@/app/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { ServiceOrder, Customer } from '@/lib/tiny-service';


// NOTE: These functions are now outside the component for better performance.
const getStatusText = (status: ServiceOrder['situacao']) => status;

const getStatusVariant = (status: ServiceOrder['situacao']) => {
  switch (status) {
    case "Em Andamento":
      return "bg-blue-500 hover:bg-blue-600";
    case "Concluído":
    case "Aprovada":
      return "bg-green-600 hover:bg-green-700";
    case "Em Aberto":
    case "Orçada":
      return "bg-yellow-500 hover:bg-yellow-600";
    case "Cancelada":
    case "Não Aprovada":
      return "bg-red-500 hover:bg-red-600";
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
};

interface OrdersClientPageProps {
  initialOrders: ServiceOrder[];
  initialCustomers: Customer[];
  fetchError: string | null;
  syncStatus?: string;
  syncMessage?: string;
}

export function OrdersClientPage({ 
    initialOrders, 
    initialCustomers, 
    fetchError: initialError,
    syncStatus,
    syncMessage,
 }: OrdersClientPageProps) {
  const [orders] = useState<ServiceOrder[]>(initialOrders);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [fetchError] = useState<string | null>(initialError);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const customer = customers.find(c => c.id === order.clienteId);
      const matchesSearch = searchTerm === '' || 
        customer?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || order.situacao === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, customers, searchTerm, statusFilter]);

  const groupedByClient = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      const customer = customers.find(c => c.id === order.clienteId);
      if (customer) {
        if (!acc[customer.id]) {
          acc[customer.id] = { customer, orders: [] };
        }
        acc[customer.id].orders.push(order);
      }
      return acc;
    }, {} as Record<string, { customer: Customer; orders: ServiceOrder[] }>);
  }, [filteredOrders, customers]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Ordens de Serviço
          </h1>
          <p className="text-muted-foreground">
            Gerencie e filtre as ordens de serviço.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <form action={syncData.bind(null, '/dashboard/ordens')}>
              <Button variant="outline" type="submit">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar
              </Button>
            </form>
            <Button asChild>
              <Link href="/dashboard/ordens/nova">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova OS
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {syncStatus === 'success' && (
         <Alert variant="default" className="border-green-500 text-green-700 [&>svg]:text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Sincronização Concluída!</AlertTitle>
            <AlertDescription>
                Os dados foram sincronizados com o Tiny com sucesso. A página foi atualizada.
            </AlertDescription>
         </Alert>
      )}
      {syncStatus === 'error' && syncMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro na Sincronização</AlertTitle>
          <AlertDescription>{decodeURIComponent(syncMessage)}</AlertDescription>
        </Alert>
      )}
      {fetchError && !syncStatus && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtros Avançados</CardTitle>
          <CardDescription>
            Encontre ordens por cliente, ID da OS ou status.
          </CardDescription>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome do cliente ou ID da OS..." 
                className="pl-8" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {["Em Aberto", "Aprovada", "Em Andamento", "Concluído", "Cancelada", "Orçada", "Não Aprovada"].map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {Object.values(groupedByClient).length > 0 ? (
              Object.values(groupedByClient).map(({ customer, orders: clientOrders }) => (
                <AccordionItem value={`client-${customer.id}`} key={customer.id}>
                  <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                    <div className='flex items-center gap-4'>
                      <span className="font-bold text-primary">{customer.nome}</span>
                      <Badge variant="secondary">{clientOrders.length} OS</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>OS ID</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell>{new Date(order.data).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge variant="default" className={getStatusVariant(order.situacao)}>
                                {getStatusText(order.situacao)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                {fetchError ? 'Não foi possível carregar as ordens.' : 'Nenhuma ordem de serviço encontrada com os filtros aplicados.'}
              </div>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
