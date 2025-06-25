import { ServiceOrder, Customer } from "@/lib/tiny-service";
import { getServiceOrders, getCustomers } from "@/lib/tiny-service";
import { TechnicianPerformanceClientPage } from "@/components/dashboard/TechniciansClientPage";

export default async function TechnicianPerformancePage() {
    let orders: ServiceOrder[] = [];
    let customers: Customer[] = [];
    let fetchError: string | null = null;

    try {
        const [ordersData, customersData] = await Promise.all([
          getServiceOrders(),
          getCustomers(),
        ]);
        orders = ordersData;
        customers = customersData;

         if (orders.length === 0) {
            fetchError = "Nenhum dado encontrado para análise. Recarregue os dados na página de Ordens de Serviço.";
        }
    } catch (error: any) {
        console.error("TechniciansPage fetch error:", error);
        fetchError = error.message || "Não foi possível carregar os dados de desempenho do Tiny.";
    }

    return (
        <TechnicianPerformanceClientPage
            initialOrders={orders}
            initialCustomers={customers}
            fetchError={fetchError}
        />
    );
}
