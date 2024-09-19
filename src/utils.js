const axios = require('axios');
const { globalApiKey, disabledCallbacks } = require('./config');
const { Pool } = require('pg');

// Configuração do pool de conexões com o PostgreSQL
const pool = new Pool({
  user: 'central_mensagens_user_api',
  host: '127.0.0.1',           
  database: 'central_mensagens',       
  password: 'taMrZ2SA7031v9ME',       
  port: 5555,                  
});

// Função para chamar a procedure fn_salvar_webhook
const salvarWebhookNoBanco = async (sessionId, dataType, data) => {
  const conteudoJson = JSON.stringify({ sessionId, dataType, data });

  try {
    await pool.query('CALL fn_salvar_webhook($1)', [conteudoJson]);
    console.log('Webhook salvo no banco com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar webhook no banco:', error.message);
  }
};

// Trigger webhook endpoint
const triggerWebhook = async (webhookURL, sessionId, dataType, data) => {
  //axios.post(webhookURL, { dataType, data, sessionId }, { headers: { 'x-api-key': globalApiKey } })
  //  .catch(error => console.error('Failed to send new message webhook:', sessionId, dataType, error.message, data || ''));

  // Salvar os dados no banco de dados
  await salvarWebhookNoBanco(sessionId, dataType, data);
};

// Função para enviar uma resposta com status de erro e mensagem
const sendErrorResponse = (res, status, message) => {
  res.status(status).json({ success: false, error: message });
};

// Função para aguardar que um item específico não seja nulo
const waitForNestedObject = (rootObj, nestedPath, maxWaitTime = 10000, interval = 100) => {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const checkObject = () => {
      const nestedObj = nestedPath.split('.').reduce((obj, key) => obj ? obj[key] : undefined, rootObj);
      if (nestedObj) {
        // Nested object exists, resolve the promise
        resolve();
      } else if (Date.now() - start > maxWaitTime) {
        // Maximum wait time exceeded, reject the promise
        console.log('Timed out waiting for nested object');
        reject(new Error('Timeout waiting for nested object'));
      } else {
        // Nested object not yet created, continue waiting
        setTimeout(checkObject, interval);
      }
    };
    checkObject();
  });
};

const checkIfEventisEnabled = (event) => {
  return new Promise((resolve, reject) => { if (!disabledCallbacks.includes(event)) { resolve(); } });
};

module.exports = {
  triggerWebhook,
  sendErrorResponse,
  waitForNestedObject,
  checkIfEventisEnabled,
};