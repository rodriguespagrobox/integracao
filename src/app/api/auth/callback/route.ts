import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/tiny-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    const errorDescription = searchParams.get('error_description') || 'Código de autorização não encontrado na resposta do Tiny.';
    return NextResponse.redirect(new URL(`/dashboard/integracao?status=error&message=${encodeURIComponent(errorDescription)}`, request.url));
  }

  try {
    await exchangeCodeForToken(code);
    return NextResponse.redirect(new URL('/dashboard/integracao?status=success', request.url));
  } catch (error: any) {
    console.error('Tiny callback error:', error);
    
    let errorMessage = error.message || 'Ocorreu um erro desconhecido durante a autenticação com o Tiny.';
    // Provide a more user-friendly message for permission errors
    if (errorMessage.startsWith('PERMISSION_ERROR:')) {
        errorMessage = 'Falha de Permissão: Não foi possível acessar o banco de dados para salvar a autenticação. Verifique as permissões da conta de serviço (IAM) para o Firestore/Cloud Datastore.';
    }

    return NextResponse.redirect(new URL(`/dashboard/integracao?status=error&message=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
