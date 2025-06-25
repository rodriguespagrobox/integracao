'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { 
    startAuthentication, 
    postCustomerToTiny,
    postServiceOrderToTiny,
    getCustomers, // Now used for connection testing
} from '@/lib/tiny-service';
import { suggestRelevantServices } from '@/ai/flows/suggest-relevant-services';

// --- AUTH ACTIONS ---

export async function login() {
  await startAuthentication();
}

// --- DATA SYNC ACTIONS ---

export async function syncData(path: string) {
  console.log("Starting data sync test from Tiny...");
  try {
    // Perform a lightweight API call to test the token and connectivity.
    await getCustomers();
    console.log("Connection to Tiny API is successful.");
    
    revalidatePath(path, 'layout'); // Use layout to re-render everything
    
    const successUrl = new URL(path, 'http://localhost');
    successUrl.searchParams.set('sync_status', 'success');
    redirect(successUrl.pathname + successUrl.search);
  } catch (error) {
    console.error("Data sync failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido na sincronização.";
    
    const errorUrl = new URL(path, 'http://localhost');
    errorUrl.searchParams.set('sync_status', 'error');
    errorUrl.searchParams.set('message', errorMessage);
    redirect(errorUrl.pathname + errorUrl.search);
  }
}


// --- AI ACTIONS ---

const serviceSuggestionSchema = z.object({
  problemDescription: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
});

type SuggestionState = {
  message?: string | null;
  suggestions?: string[];
}

export async function getServiceSuggestions(
  prevState: SuggestionState,
  formData: FormData
): Promise<SuggestionState> {
  const validatedFields = serviceSuggestionSchema.safeParse({
    problemDescription: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      message: 'A descrição é muito curta.',
    };
  }

  try {
    const result = await suggestRelevantServices({
      problemDescription: validatedFields.data.problemDescription,
    });
    if (result.suggestedServices && result.suggestedServices.length > 0) {
      return {
        message: 'Sugestões geradas com sucesso.',
        suggestions: result.suggestedServices,
      };
    }
    return {
      message: 'Nenhuma sugestão encontrada para a descrição fornecida.',
    }

  } catch (error) {
    console.error('AI Error:', error);
    return {
      message: 'Ocorreu um erro ao gerar sugestões. Tente novamente mais tarde.',
    };
  }
}


// --- ENTITY CREATION ACTIONS ---

const customerSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido.'),
  email: z.string().email('E-mail inválido.'),
  tipoPessoa: z.enum(['F', 'J']),
});

type CustomerFormState = {
  message: string | null;
  success: boolean;
}

export async function createCustomer(prevState: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const validatedFields = customerSchema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    return {
      message: "Dados inválidos: " + validatedFields.error.flatten().fieldErrors.nome,
      success: false,
    };
  }
  
  try {
    await postCustomerToTiny(validatedFields.data);
    
    revalidatePath('/dashboard/clientes');
    return { message: "Cliente criado com sucesso no Tiny!", success: true };

  } catch (error) {
    console.error("Failed to create customer:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return { message: errorMessage, success: false };
  }
}

const serviceOrderSchema = z.object({
  clienteId: z.string().min(1, "Selecione um cliente."),
  description: z.string().min(10, "A descrição é muito curta."),
  dataInicio: z.string().nonempty("A data de início é obrigatória."),
  dataPrevista: z.string().nonempty("A data prevista é obrigatória."),
  tecnico: z.string().min(3, "O nome do técnico é obrigatório."),
  selectedServices: z.string(), // JSON string of services
});

type ServiceOrderFormState = {
  message: string | null;
  success: boolean;
}

export async function createServiceOrder(prevState: ServiceOrderFormState, formData: FormData): Promise<ServiceOrderFormState> {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = serviceOrderSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { message: "Dados do formulário inválidos. Verifique todos os campos.", success: false };
    }

    try {
        const orderData = {
            ...validatedFields.data,
            servicos: JSON.parse(validatedFields.data.selectedServices),
        };
        
        await postServiceOrderToTiny(orderData);
        
        revalidatePath('/dashboard/ordens');
        return { message: "Ordem de Serviço criada com sucesso!", success: true };
    } catch (error) {
        console.error("Failed to create service order:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        return { message: errorMessage, success: false };
    }
}
