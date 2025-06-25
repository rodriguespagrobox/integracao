import { ServiceOrderForm } from "@/components/ordens/ServiceOrderForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCustomers } from "@/lib/tiny-service";

export default async function NewOrderPage() {
  const customers = await getCustomers().catch(err => {
    console.error("Failed to fetch customers for new order form:", err);
    // Return empty array on error so the page still loads, the form will handle the empty state
    return []; 
  });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard/ordens">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Nova Ordem de Serviço
          </h1>
        </div>
        <p className="text-muted-foreground ml-14">
          Preencha os dados abaixo para criar uma nova OS no sistema e no Tiny.
        </p>
      </header>
      <ServiceOrderForm customers={customers} />
    </div>
  );
}
