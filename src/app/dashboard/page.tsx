import { ServiceOrder } from "@/lib/tiny-service";
import { getServiceOrders } from "@/lib/tiny-service";
import { DashboardClientPage } from "@/components/dashboard/DashboardClientPage";

export default async function DashboardPage() {
  let orders: ServiceOrder[] = [];
  let fetchError: string | null = null;

  try {
    orders = await getServiceOrders();
     if (orders.length === 0) {
        fetchError = "Nenhuma ordem de serviço encontrada no Tiny. Tente recarregar os dados na página de Ordens de Serviço.";
    }
  } catch (error: any) {
    console.error("Dashboard fetch error:", error);
    fetchError = error.message || "Não foi possível carregar os dados do painel do Tiny.";
  }

  return (
    <DashboardClientPage initialOrders={orders} fetchError={fetchError} />
  );
}
