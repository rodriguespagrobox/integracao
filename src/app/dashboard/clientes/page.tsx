import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PlusCircle, Search, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getCustomers } from "@/lib/tiny-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { syncData } from "@/app/actions";

export default async function CustomersPage({ searchParams }: { searchParams?: { [key: string]: string | undefined }}) {
  let customers: any[] = [];
  let fetchError: string | null = null;
  const syncStatus = searchParams?.sync_status;
  const message = searchParams?.message;

  try {
    customers = await getCustomers();
    if (customers.length === 0 && !syncStatus) {
        fetchError = "Nenhum cliente encontrado no Tiny. Tente sincronizar novamente.";
    }
  } catch (error: any) {
    console.error("Failed to fetch customers from Tiny:", error);
    fetchError = error.message || "Não foi possível carregar os clientes do Tiny.";
  }

  const getStatusText = (status: string) => (status === 'A' ? 'Ativo' : 'Inativo');
  const getStatusVariant = (status: string) => (status === 'A' ? 'default' : 'destructive');
  const getPersonTypeText = (type: string) => (type === 'F' ? 'Física' : 'Jurídica');

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Gerencie e busque por clientes. Os dados são buscados em tempo real do Tiny.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
                 <form action={syncData.bind(null, '/dashboard/clientes')}>
                    <Button variant="outline" type="submit">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sincronizar / Recarregar
                    </Button>
                </form>
                <Button asChild>
                    <Link href="/dashboard/clientes/novo">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Cliente
                    </Link>
                </Button>
            </div>
        </div>
      </header>
       {syncStatus === 'error' && message && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro na Conexão</AlertTitle>
          <AlertDescription>{decodeURIComponent(message)}</AlertDescription>
        </Alert>
      )}
      {fetchError && !syncStatus && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Dados</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Encontre um cliente pelo nome ou CPF/CNPJ.
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar clientes..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length > 0 ? (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.nome}</TableCell>
                    <TableCell>{customer.cpfCnpj}</TableCell>
                    <TableCell>{getPersonTypeText(customer.tipoPessoa)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(customer.situacao)} className={getStatusVariant(customer.situacao) === 'default' ? 'bg-green-600' : ''}>
                        {getStatusText(customer.situacao)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          Ver OS
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    {fetchError ? 'Não foi possível carregar os clientes.' : 'Nenhum cliente encontrado.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
