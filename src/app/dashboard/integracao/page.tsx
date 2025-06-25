
'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Settings, CheckCircle2, AlertTriangle, Link2, Clipboard, Check } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { login } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

function IntegrationStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const message = searchParams.get('message');

  if (!status) {
     return (
       <Alert>
        <Settings className="h-4 w-4" />
        <AlertTitle>Status da Conexão</AlertTitle>
        <AlertDescription>
          Aguardando conexão. Use o botão abaixo para conectar sua conta do Tiny ERP.
        </AlertDescription>
      </Alert>
     )
  }

  if (status === 'success') {
    return (
      <Alert variant="default" className="border-green-500 text-green-700 [&>svg]:text-green-500">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Conexão Bem-Sucedida!</AlertTitle>
        <AlertDescription>
          A integração com o Tiny ERP foi estabelecida com sucesso. Seus dados poderão ser sincronizados.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Falha na Conexão</AlertTitle>
        <AlertDescription>
          {message || 'Ocorreu um erro ao tentar conectar com o Tiny ERP. Por favor, tente novamente.'}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

function IntegrationPageComponent() {
  const [redirectUri, setRedirectUri] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // This ensures window is defined and runs only on the client, avoiding SSR mismatch
    if (typeof window !== 'undefined') {
        setRedirectUri(`${window.location.origin}/api/auth/callback`);
    }
  }, []);

  const handleCopy = () => {
    if (redirectUri) {
      navigator.clipboard.writeText(redirectUri).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="flex items-center gap-4 mb-4">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Integração com Tiny ERP
          </h1>
        </div>
        <p className="text-muted-foreground ml-14">
          Gerencie sua conexão com a API do Tiny.
        </p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Configuração da Conexão</CardTitle>
           <CardDescription>
            Siga os passos abaixo para autorizar este aplicativo a acessar seus dados no Tiny.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label htmlFor="redirect-uri" className='font-semibold'>Passo 1: Copie sua URL de Redirecionamento</Label>
                <p className='text-sm text-muted-foreground mb-2'>
                    Esta URL deve ser idêntica à registrada no seu app no painel do Tiny.
                </p>
                <div className="flex items-center gap-2">
                    <Input id="redirect-uri" value={redirectUri} readOnly placeholder="Carregando URL..." />
                    <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar URL">
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <Separator />
            
            <div>
                <p className='font-semibold'>Passo 2: Conecte-se</p>
                 <p className='text-sm text-muted-foreground mb-4'>
                    Após registrar a URL acima no Tiny, clique no botão para iniciar o processo de conexão.
                </p>
                 <IntegrationStatus />
                <form action={login} className='mt-4'>
                    <Button>
                        <Link2 className="mr-2 h-4 w-4" />
                        Conectar / Reconectar com Tiny ERP
                    </Button>
                </form>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function IntegrationPage() {
  return (
    // Suspense is recommended when using useSearchParams
    <Suspense fallback={<div>Carregando...</div>}>
      <IntegrationPageComponent />
    </Suspense>
  )
}
