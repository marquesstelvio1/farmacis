/**
 * Normalizes API errors and network issues into user-friendly Portuguese messages
 */
export function normalizeError(error: unknown): string {
  // Handle network errors
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    
    if (message.includes('failed to fetch')) {
      return 'Falha na conexão com o servidor';
    }
    if (message.includes('json')) {
      return 'Erro ao processar resposta do servidor';
    }
    if (message.includes('network')) {
      return 'Problema na conexão de rede';
    }
  }

  // Handle Response errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // JSON parsing
    if (message.includes('unexpected end of json')) {
      return 'Resposta inválida do servidor';
    }
    if (message.includes('json')) {
      return 'Erro ao processar dados';
    }

    // Connection issues
    if (message.includes('timeout')) {
      return 'Tempo limite de conexão excedido';
    }
    if (message.includes('connection refused')) {
      return 'Servidor indisponível';
    }
    if (message.includes('connection reset')) {
      return 'Conexão perdida';
    }

    // Database/Server errors
    if (message.includes('unique')) {
      return 'Esse registro já existe';
    }
    if (message.includes('not found')) {
      return 'Registro não encontrado';
    }
    if (message.includes('permission')) {
      return 'Você não tem permissão para essa ação';
    }
    if (message.includes('invalid')) {
      return 'Dados inválidos';
    }

    // If it's a custom error message (already in Portuguese or English), return as is
    if (error.message && error.message.length < 200) {
      return error.message;
    }
  }

  return 'Ocorreu um erro inesperado';
}

/**
 * Safely parses fetch response and handles errors
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.message || `Erro ${response.status}`);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== `Erro ${response.status}`) {
          throw new Error(`Erro ${response.status}`);
        }
        throw parseError;
      }
    }

    try {
      return await response.json();
    } catch (parseError) {
      if (response.status === 200) return {} as T; // Handle empty success responses
      throw new Error('Unexpected end of JSON input');
    }
  } catch (error) {
    console.error("Fetch Error Detail:", error);
    throw new Error(normalizeError(error));
  }
}
