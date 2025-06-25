import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from './actions';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md text-center">
        <header className="mb-8 flex justify-center" aria-label="Logotipo da AGROBOX LAB">
          <AppLogo className="h-16 w-auto text-primary" />
        </header>
        <main>
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle className="font-headline text-4xl font-bold text-foreground">
                Bem-vindo ao AGROBOX LAB
              </CardTitle>
              <CardDescription className="pt-2">
                Acesse para gerenciar suas ordens de serviço e clientes com a potência da API Tiny.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={login}>
                <Button type="submit" size="lg" className="w-full font-bold text-lg py-7 group">
                  Entrar com Tiny ERP
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-6 px-4">
                Você será redirecionado para a tela de autorização da Tiny para continuar de forma segura.
              </p>
            </CardContent>
          </Card>
        </main>
        <footer className="mt-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} AGROBOX LAB. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
}
