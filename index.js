import app, { initPromise } from '../server/index.ts';

export default async function handler(req, res) {
  // Aguarda a inicialização das rotas e serviços
  await initPromise;
  // Encaminha o pedido para o Express
  app(req, res);
}