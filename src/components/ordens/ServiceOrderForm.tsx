'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useFormState, useFormStatus } from 'react-dom';
import { z } from 'zod';
import { getServiceSuggestions, createServiceOrder } from '@/app/actions';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Wand2, Loader2, PlusCircle, Trash2 } from 'lucide-react';

const formSchema = z.object({
  clienteId: z.string({ required_error: "Selecione um cliente." }),
  description: z.string().min(10, "A descrição do problema é muito curta."),
  dataInicio: z.string().nonempty("A data de início é obrigatória."),
  dataPrevista: z.string().nonempty("A data prevista é obrigatória."),
  tecnico: z.string().min(3, "O nome do técnico é obrigatório."),
});

const initialSuggestionState = { message: null, suggestions: [] };
const initialSubmitState = { message: null, success: false };

function SuggestionButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
      Sugerir Serviços
    </Button>
  );
}

function SubmitOrderButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Ordem de Serviço
        </Button>
    )
}

interface Customer {
  id: string;
  nome: string;
}

interface ServiceOrderFormProps {
  customers: Customer[];
}

export function ServiceOrderForm({ customers = [] }: ServiceOrderFormProps) {
  const [suggestionState, suggestionAction] = useFormState(getServiceSuggestions, initialSuggestionState);
  const [submitState, submitAction] = useFormState(createServiceOrder, initialSubmitState);
  const [selectedServices, setSelectedServices] = useState<{name: string}[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      tecnico: '',
      dataInicio: new Date().toISOString().split('T')[0],
      dataPrevista: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (suggestionState.message && suggestionState.message !== 'Sugestões geradas com sucesso.') {
       toast({
        title: 'Sugestão de Serviços',
        description: suggestionState.message,
        variant: 'destructive',
      });
    }
  }, [suggestionState, toast]);

   useEffect(() => {
    if (submitState.message) {
      toast({
        title: submitState.success ? 'Sucesso!' : 'Erro ao criar OS',
        description: submitState.message,
        variant: submitState.success ? 'default' : 'destructive',
      });
      if (submitState.success) {
        router.push('/dashboard/ordens');
      }
    }
  }, [submitState, toast, router]);
  
  const addService = (serviceName: string) => {
    if (!selectedServices.find(s => s.name === serviceName)) {
      setSelectedServices(prev => [...prev, { name: serviceName }]);
    }
  };

  const removeService = (serviceName: string) => {
    setSelectedServices(prev => prev.filter(s => s.name !== serviceName));
  };


  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form action={submitAction} className="space-y-8">
            <input type="hidden" name="selectedServices" value={JSON.stringify(selectedServices)} />
            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Informações Gerais</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente existente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.length > 0 ? (
                            customers.map((customer) => (
                              <SelectItem key={customer.id} value={String(customer.id)}>
                                {customer.nome}
                              </SelectItem>
                            ))
                           ) : (
                             <SelectItem value="no-customers" disabled>
                              Nenhum cliente encontrado. Sincronize na página de clientes.
                            </SelectItem>
                           )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tecnico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Técnico Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do técnico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataPrevista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Prevista de Conclusão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium font-headline">Descrição e Serviços</h3>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Problema</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva detalhadamente o problema do equipamento..."
                        className="resize-y"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-4">
                <form action={suggestionAction}>
                  <input type="hidden" name="description" value={form.watch('description')} />
                  <SuggestionButton />
                </form>
                {suggestionState.suggestions && suggestionState.suggestions.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Sugestões de Serviços:</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestionState.suggestions.map((suggestion, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-primary/20" onClick={() => addService(suggestion)}>
                           <PlusCircle className="mr-2 h-3 w-3" /> {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <FormLabel>Serviços a Realizar</FormLabel>
                <div className="mt-2 p-4 border rounded-lg min-h-[100px] space-y-2 bg-muted/30">
                  {selectedServices.length > 0 ? selectedServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded-md shadow-sm">
                      <span>{service.name}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeService(service.name)}>
                        <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço adicionado. Use as sugestões da IA ou adicione manualmente.</p>
                  )}
                </div>
              </div>
            </div>

            <SubmitOrderButton />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
