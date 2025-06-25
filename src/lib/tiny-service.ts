'use server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Hardcoded credentials for development.
const TINY_CLIENT_ID = 'tiny-api-f86f2823ddb2a15e8137e32a0792b46adcdab71f-1750787943';
const TINY_CLIENT_SECRET = 'tl1rP03hB15aPHWbTNv485CxP7MASxgV';
const TINY_REDIRECT_URI = 'https://9002-firebase-studio-1750771184106.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev/api/auth/callback';

const TINY_AUTH_URL = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth';
const TINY_TOKEN_URL = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token';
const API_BASE_URL = 'https://api.tiny.com.br/public-api/v3';

export type ServiceOrder = {
  id: string;
  clienteId: string;
  clienteNome: string;
  data: string;
  equipamento: string;
  tecnico: string;
  situacao: "Em Aberto" | "Aprovada" | "Em Andamento" | "Concluído" | "Cancelada" | "Orçada" | "Não Aprovada" | "Desconhecido";
  valorMaoDeObra: number;
};

export type Customer = {
  id: string;
  nome: string;
  cpfCnpj: string;
  tipoPessoa: "F" | "J";
  situacao: "A" | "I";
};

const ACCESS_TOKEN_COOKIE = 'tiny_access_token';
const REFRESH_TOKEN_COOKIE = 'tiny_refresh_token';

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function saveToken(tokenData: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}) {
  const cookieStore = cookies();
  const expires = new Date(Date.now() + tokenData.expires_in * 1000);

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokenData.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires,
  });

  // Refresh token expires in 1 day (86400 seconds)
  const refreshExpires = new Date(Date.now() + 86400 * 1000);
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokenData.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: refreshExpires,
  });
  console.log('Token successfully saved to httpOnly cookies.');
}

async function getToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
}


// Function to start the authentication flow
export async function startAuthentication() {
  const params = new URLSearchParams({
    client_id: TINY_CLIENT_ID,
    redirect_uri: TINY_REDIRECT_URI,
    scope: 'openid',
    response_type: 'code',
  });

  const authUrl = `${TINY_AUTH_URL}?${params.toString()}`;
  redirect(authUrl);
}

// Function to exchange the authorization code for an access token and save it
export async function exchangeCodeForToken(code: string): Promise<void> {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', TINY_CLIENT_ID);
  params.append('client_secret', TINY_CLIENT_SECRET);
  params.append('redirect_uri', TINY_REDIRECT_URI);
  params.append('code', code);

  const response = await fetch(TINY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const tokenData = await response.json();

  if (!response.ok) {
    console.error('Tiny Token API Error:', tokenData);
    throw new Error(tokenData.error_description || 'Falha ao obter o token de acesso da API do Tiny.');
  }

  await saveToken(tokenData);
}

// Function to refresh the access token
async function refreshAccessToken(): Promise<string> {
    if (isRefreshing && refreshPromise) {
      console.log('Attaching to existing token refresh promise.');
      return refreshPromise;
    }
    isRefreshing = true;
    console.log('Initiating new token refresh.');

    refreshPromise = new Promise(async (resolve, reject) => {
        try {
            const storedToken = await getToken();
            if (!storedToken || !storedToken.refreshToken) {
                return reject(new Error('Refresh token não encontrado. É necessária uma nova autenticação.'));
            }

            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('client_id', TINY_CLIENT_ID);
            params.append('client_secret', TINY_CLIENT_SECRET);
            params.append('refresh_token', storedToken.refreshToken);

            const response = await fetch(TINY_TOKEN_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            const tokenData = await response.json();

            if (!response.ok) {
                console.error('Tiny Refresh Token Error:', { status: response.status, body: tokenData });
                // Clear invalid cookies on refresh failure
                cookies().delete(ACCESS_TOKEN_COOKIE);
                cookies().delete(REFRESH_TOKEN_COOKIE);
                const errorMessage = tokenData.error_description || tokenData.message || 'Erro desconhecido';
                return reject(new Error(`Sessão expirada. Falha ao renovar o token de acesso do Tiny (HTTP ${response.status}): ${errorMessage}. Por favor, conecte-se novamente.`));
            }
            
            await saveToken(tokenData);
            resolve(tokenData.access_token);
        } catch (error) {
            reject(error);
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    });

    return refreshPromise;
}

// Generic function to make authorized requests to the Tiny API, with token refresh logic
async function fetchFromTiny(endpoint: string, options: RequestInit = {}, retry = true): Promise<any> {
    console.log(`TINY_SERVICE: Fetching from endpoint: ${endpoint}`);
    let tokenDetails = await getToken();
    
    if (!tokenDetails || !tokenDetails.accessToken) {
        console.error('TINY_SERVICE: Auth check failed. No access token in cookies.');
        throw new Error('Não autorizado. O token de acesso do Tiny não foi encontrado. Por favor, reautentique na página de Integração.');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const requestOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${tokenDetails.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    };

    console.log(`TINY_SERVICE: Making authorized request to ${endpoint}.`);
    const response = await fetch(url, requestOptions);
    console.log(`TINY_SERVICE: Initial response for ${endpoint} - Status: ${response.status}`);

    if (response.status === 401 && retry) {
        console.log(`TINY_SERVICE: Received 401 for ${endpoint}. Attempting token refresh.`);
        try {
            const newAccessToken = await refreshAccessToken();
            console.log(`TINY_SERVICE: Refresh successful. Retrying fetch for ${endpoint}.`);
            // We call fetchFromTiny again, which will re-read the new token from cookies
            return await fetchFromTiny(endpoint, options, false); // Pass original options
        } catch (refreshError) {
             console.error(`TINY_SERVICE: Token refresh process failed for ${endpoint}.`, refreshError);
             throw refreshError;
        }
    }

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'Resposta inválida da API' }));
        console.error(`TINY_SERVICE: Final error on ${endpoint} (Status: ${response.status})`, errorBody);
        throw new Error(`Erro na API do Tiny (${response.status}): ${errorBody.mensagem || 'Não autorizado ou erro no servidor do Tiny.'}. Tente se reconectar na página de Integração.`);
    }

    const textResponse = await response.text();
    if (!textResponse) {
        return null;
    }

    const jsonResponse = JSON.parse(textResponse);
    return jsonResponse.data ?? jsonResponse;
}

function mapSituacao(situacao: string): ServiceOrder['situacao'] {
    const situacaoMap: Record<string, ServiceOrder['situacao']> = {
        '0': 'Em Aberto',
        '1': 'Orçada',
        '2': 'Concluído', 
        '3': 'Concluído', // "Finalizada" is also mapped to "Concluído"
        '4': 'Não Aprovada',
        '5': 'Aprovada',
        '6': 'Em Andamento',
        '7': 'Cancelada'
    };
    return situacaoMap[situacao] || 'Desconhecido';
}

// Fetch all customers from Tiny
export async function getCustomers(): Promise<Customer[]> {
  const tinyCustomers = await fetchFromTiny('/contatos');
  if (!tinyCustomers || !Array.isArray(tinyCustomers)) return [];
  return tinyCustomers.map((c: any) => ({
    id: String(c.id),
    nome: c.nome,
    cpfCnpj: c.cpf_cnpj,
    tipoPessoa: c.tipo_pessoa,
    situacao: c.situacao
  }));
}

// Fetch a detailed service order from Tiny
export async function getServiceOrderDetails(id: string): Promise<ServiceOrder> {
    const o = await fetchFromTiny(`/ordem-servico/${id}`);
    return {
        id: String(o.id),
        clienteId: String(o.contato.id),
        clienteNome: o.contato.nome,
        data: o.data,
        equipamento: o.equipamento || "Não especificado",
        tecnico: o.tecnico || "Não atribuído",
        situacao: mapSituacao(o.situacao),
        valorMaoDeObra: parseFloat(o.totalServicos || 0)
    };
}

// Fetch all service orders IDs and then their details
export async function getServiceOrders(): Promise<ServiceOrder[]> {
    const tinyOrdersList = await fetchFromTiny('/ordem-servico');
    
    if (!tinyOrdersList || !Array.isArray(tinyOrdersList)) {
        console.log("No service orders returned from Tiny or invalid format.");
        return [];
    }
    
    const detailedOrdersPromises = tinyOrdersList.map((o: any) => getServiceOrderDetails(o.id));
    const detailedOrders = await Promise.all(detailedOrdersPromises);
    
    return detailedOrders;
}

// POST a new customer to Tiny
export async function postCustomerToTiny(customerData: Omit<Customer, 'id' | 'situacao'> & { email: string }): Promise<{ id: string }> {
  const payload = {
    nome: customerData.nome,
    tipo_pessoa: customerData.tipoPessoa,
    cpf_cnpj: customerData.cpfCnpj,
    email: customerData.email,
  };
  const response = await fetchFromTiny('/contatos', {
    method: 'POST',
    body: JSON.stringify({ contato: payload }),
  });
  return { id: String(response.id) };
}

// POST a new service order to Tiny
export async function postServiceOrderToTiny(orderData: any): Promise<{ id: string }> {
  const payload = {
    cliente: { id: parseInt(orderData.clienteId, 10) },
    tecnico: orderData.tecnico,
    dataInicio: orderData.dataInicio,
    dataPrevista: orderData.dataPrevista,
    descricao: orderData.description,
     assistenciaTecnica: {
        equipamento: "Equipamento Padrão",
    },
    servicos: [], // Sending empty as we only have service names, not IDs.
  };

  const response = await fetchFromTiny('/ordem-servico', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { id: String(response.id) };
}
