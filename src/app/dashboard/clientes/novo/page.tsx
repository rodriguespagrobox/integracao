import { CustomerForm } from "@/components/clientes/CustomerForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewCustomerPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
         <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard/clientes">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Novo Cliente
          </h1>
        </div>
        <p className="text-muted-foreground ml-14">
          Preencha os dados abaixo para cadastrar um novo cliente no seu sistema e no Tiny.
        </p>
      </header>
      <CustomerForm />
    </div>
  );
}
