// config/database.js
const { Sequelize } = require('sequelize');
// Lembre-se de instalar o pacote 'pg' (npm install pg pg-hstore)
// para conectar ao PostgreSQL

// Configuração PostgreSQL (hardcoded)
// !! ATENÇÃO: HARDCODAR CREDENCIAIS NÃO É SEGURO PARA AMBIENTES DE PRODUÇÃO !!
// USE VARIÁVEIS DE AMBIENTE (.env com dotenv) PARA CREDENCIAIS EM PROJETOS REAIS.
const sequelize = new Sequelize('talisma', 'postgres', 'patrick', {
  host: 'localhost', // Endereço do seu servidor PostgreSQL (geralmente localhost)
  port: 5432,      // Porta padrão do PostgreSQL
  dialect: 'postgres', // Especifica o dialeto do banco de dados
  logging: false, // Defina como true (ou console.log) para ver as queries SQL executadas
  dialectOptions: {
    // Configuração SSL. Pode precisar ajustar dependendo da sua configuração do Postgres.
    // Em ambientes locais simples, talvez precise desabilitar o SSL com ssl: false (PARA TESTE APENAS).
    // NÃO use ssl: false em produção!
    // ssl: { rejectUnauthorized: false }
  },
  pool: { // Configurações do pool de conexões (opcional, mas recomendado)
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Não precisamos chamar authenticate ou sync aqui, isso será feito em app.js
/*
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados PostgreSQL estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados PostgreSQL:', error);
    // Opcional: Sair do processo se não conseguir conectar ao DB

  }
}
*/

module.exports = sequelize; // Exporta a instância sequelize