import { ServiceOrder, Customer } from "@/lib/tiny-service";
import { getServiceOrders, getCustomers } from "@/lib/tiny-service";
import { OrdersClientPage } from "@/components/dashboard/OrdersClientPage";

export default async function OrdersPage({ searchParams }: { searchParams?: { [key:string]: string | undefined } }) {
    let orders: ServiceOrder[] = [];
    let customers: Customer[] = [];
    let fetchError: string | null = null;
    const syncStatus = searchParams?.sync_status;
    const message = searchParams?.message;

    try {
        // Fetch sequentially to avoid potential race conditions on token refresh
        customers = await getCustomers();
        orders = await getServiceOrders();

        if (orders.length === 0 && !syncStatus) {
            fetchError = "Nenhuma ordem de serviço encontrada no Tiny. Tente sincronizar/recarregar a página.";
        }
    } catch (error: any) {
        console.error("OrdersPage fetch error:", error);
        fetchError = error.message || "Não foi possível carregar os dados do Tiny.";
    }

    return (
        <OrdersClientPage 
            initialOrders={orders} 
            initialCustomers={customers} 
            fetchError={fetchError}
            syncStatus={syncStatus}
            syncMessage={message}
        />
    );
}
