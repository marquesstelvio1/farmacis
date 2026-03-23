-- Script para limpar o histórico de pedidos
-- CUIDADO: Esta operação é irreversível. Faça backup antes de executar.

-- Opção 1: Deletar TODOS os pedidos (cuidado!)
-- BEGIN TRANSACTION;
-- DELETE FROM order_items;
-- DELETE FROM order_status_history;
-- DELETE FROM orders;
-- COMMIT;

-- Opção 2: Deletar pedidos mais antigos que X dias (mais seguro)
-- Exemplo: Deletar pedidos de mais de 90 dias atrás
BEGIN TRANSACTION;

-- Primeiro deletar os items dos pedidos antigos
DELETE FROM order_items 
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE created_at < NOW() - INTERVAL '90 days'
);

-- Depois deletar o histórico de status
DELETE FROM order_status_history
WHERE order_id IN (
  SELECT id FROM orders 
  WHERE created_at < NOW() - INTERVAL '90 days'
);

-- Finalmente deletar os pedidos antigos
DELETE FROM orders 
WHERE created_at < NOW() - INTERVAL '90 days';

COMMIT;

-- Se quiser confirmar quantos foram deletados, execute:
-- SELECT COUNT(*) FROM orders;
