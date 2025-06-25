'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { initiateTinyAuth } from '@/app/actions';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Loader2, Clipboard, Check } from 'lucide-react';

const formSchema = z.object({
  clientId: z.string().min(1, 'Client ID é obrigatório.'),
  clientSecret: z.string().min(1, 'Client Secret é obrigatório.'),
  redirectUri: z.string().url('URL de redirecionamento inválida.'),
});

const initialState: { message: string | null; success: boolean } = {
  message: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar e Iniciar Conexão
    </Button>
  );
}

export function IntegrationForm() {
  const [state, formAction] = useFormState(initiateTinyAuth, initialState);
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      clientSecret: '',
      redirectUri: '',
    },
  });

  useEffect(() => {
    // Set the default redirect URI on the client after hydration to avoid a mismatch.
    if (typeof window !== 'undefined' && !form.getValues('redirectUri')) {
      form.setValue('redirectUri', `${window.location.origin}/api/auth/callback`);
    }
  }, [form]);

  useEffect(() => {
    if (!state.success && state.message) {
      toast({
        title: 'Erro na Configuração',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state]);

  const handleCopy = () => {
    const url = form.getValues('redirectUri');
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Credenciais OAuth 2.0</CardTitle>
        <CardDescription>
          Insira as informações do seu app no painel do Tiny ERP. Ao salvar, você será redirecionado para autorizar a conexão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={formAction} className="space-y-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu Client ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    O ID de cliente da sua aplicação no Tiny.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Secret</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••••••••••••••" {...field} />
                  </FormControl>
                   <FormDescription>
                    O segredo de cliente da sua aplicação no Tiny.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="redirectUri"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Redirecionamento Autorizada</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar URL">
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                  </div>
                   <FormDescription>
                    Esta URL deve ser idêntica à registrada no seu app no Tiny. Use o botão para copiar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
