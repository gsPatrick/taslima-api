// app.js

const express = require('express');
require('dotenv').config(); // Carrega as variáveis do .env no process.env
const path = require('path'); // Importa o módulo path para lidar com caminhos de arquivo
const fs = require('fs');   // Importa o módulo fs para operações de sistema de arquivos

const db = require('./src/models');

const authRoutes = require('./src/auth/auth.routes');
// <<<< IMPORTANTE >>>>
// Certifique-se que 'product.routes.js' existe e configura a rota '/upload-image'
// USANDO MULTER configurado para salvar os arquivos em './uploads/product-images/'
const productRoutes = require('./src/products/product.routes');
const userRoutes = require('./src/users/userRoutes');
// ... importe outras rotas conforme necessário

const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares Básicos ---
app.use(cors());
app.use(express.json());
// Adicionado para permitir o envio de dados urlencoded, se necessário
// app.use(express.urlencoded({ extended: true }));


// --- Configuração e Criação do Diretório de Upload ---
// Define o caminho para a pasta onde as imagens serão salvas (relativo ao diretório onde app.js está)
// Assumimos que Multer está configurado para salvar em './uploads/product-images/'
const uploadDir = path.join(__dirname, 'uploads', 'product-images');

// Cria o diretório de upload se ele não existir durante a inicialização
if (!fs.existsSync(uploadDir)) {
    console.log(`${new Date().toISOString()} - [STARTUP] Diretório de upload não encontrado: "${uploadDir}". Criando...`);
    try {
        // { recursive: true } garante que pastas pai ('uploads') também sejam criadas se não existirem
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`${new Date().toISOString()} - [STARTUP] Diretório de upload criado com sucesso.`);
    } catch (error) {
        console.error(`${new Date().toISOString()} - [FATAL STARTUP ERROR] Falha ao criar o diretório de upload: "${uploadDir}"`, error);
        // Erro fatal se não conseguir criar o diretório de upload, o app não pode funcionar
        process.exit(1);
    }
} else {
     console.log(`${new Date().toISOString()} - [STARTUP] Diretório de upload já existe: "${uploadDir}".`);
}

// --- Middleware para Servir Arquivos Estáticos (Uploads) ---
// Isto permite que o navegador acesse arquivos dentro da pasta 'uploads'.
// Mapeamos a URL '/uploads' para o diretório físico './uploads'.
// Um arquivo em './uploads/product-images/foto.jpg' será acessível via http://localhost:3001/uploads/product-images/foto.jpg
// Note que o caminho do middleware '/uploads' é diferente do caminho físico 'uploads/product-images'.
// Isso permite servir *qualquer* arquivo dentro de './uploads', o que é flexível.
// Se você quiser servir APENAS de './uploads/product-images' sob '/uploads', mude o path.join abaixo.
const staticServeDir = path.join(__dirname, 'uploads'); // Servir a pasta raiz 'uploads'
app.use('/uploads', express.static(staticServeDir));
console.log(`Servindo arquivos estáticos da pasta "${staticServeDir}" em rotas que começam com "/uploads"`);


// --- Middleware de Logging de Requisições ---
// Colocado após o static middleware para não logar requests por arquivos estáticos
app.use((req, res, next) => {
    // Omitir logging para requisições de arquivos estáticos (verificando se começa com '/uploads')
    if (req.originalUrl.startsWith('/uploads') || req.originalUrl.endsWith('.css') || req.originalUrl.endsWith('.js') || req.originalUrl.endsWith('.png') || req.originalUrl.endsWith('.jpg') || req.originalUrl.endsWith('.jpeg') || req.originalUrl.endsWith('.gif') || req.originalUrl === '/favicon.ico') {
      return next();
    }
    console.log(`${new Date().toISOString()} - [REQUEST] ${req.method} ${req.originalUrl}`);
    next();
});


// --- Rotas Principais da API ---
app.get('/', (req, res) => {
  res.send('API de E-commerce de Agronegócio está online!');
});

app.get('/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.status(200).send({ status: 'OK', database: 'Connected' });
  } catch (error) {
    console.error(`${new Date().toISOString()} - [HEALTH CHECK FAILED] Database connection error:`, error);
    res.status(500).send({ status: 'ERROR', database: 'Disconnected', error: error.message });
  }
});

// Monta as rotas importadas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', userRoutes); // Rotas de usuário, se existirem fora de /auth
app.use('/api/v1/products', productRoutes); // Certifique-se que productRoutes.js inclui a rota /upload-image configurada com Multer


// --- Middleware de 404 (Rota Não Encontrada) ---
// Deve ser o último middleware de rota antes dos handlers de erro
app.use((req, res, next) => {
  res.status(404).send({ message: 'Rota não encontrada.' });
});


// --- Middleware de Tratamento de Erros Global ---
// Captura erros passados com next(err) ou erros lançados em handlers síncronos
app.use((err, req, res, next) => {
  // Verifica se o erro já tem um código de status, senão usa 500
  const statusCode = err.status || err.statusCode || 500;

  // Loga o erro detalhadamente no console do servidor
  console.error(`${new Date().toISOString()} - [REQUEST ERROR] ${req.method} ${req.originalUrl} - Status: ${statusCode}`);
  console.error(err); // Loga o erro completo, incluindo stack trace em desenvolvimento

  // Prepara a mensagem de erro para enviar ao cliente
  let errorMessage = 'Ocorreu um erro inesperado no servidor.';
  if (process.env.NODE_ENV === 'development' || statusCode < 500) {
      // Em desenvolvimento ou para erros do cliente (4xx), envia a mensagem do erro original
      errorMessage = err.message || errorMessage;
  }

  // Envia a resposta de erro ao cliente
  res.status(statusCode).send({
    message: errorMessage,
    // Inclui o stack trace apenas em ambiente de desenvolvimento
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});


// --- Handlers para Erros Globais (fora do Request/Response Cycle) ---
// Capturam erros que não são tratados por rotas ou middlewares normais

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${new Date().toISOString()} - [UNHANDLED REJECTION] Possivelmente uma promessa não tratada ou erro assíncrono:`, reason);
  // Em produção, você pode querer enviar um alerta ou encerrar o processo de forma graciosa.
  // Para depuração, logar já é muito útil.
  // process.exit(1); // Descomente para sair em caso de unhandledRejection (geralmente recomendado em produção)
});

process.on('uncaughtException', (err) => {
  console.error(`${new Date().toISOString()} - [UNCaught EXCEPTION] Erro síncrono não capturado:`, err);
  // Erros síncronos não capturados são muito perigosos e indicam que o aplicativo está em um estado inconsistente.
  // Geralmente é melhor encerrar o processo imediatamente e confiar em um gerenciador de processos (como PM2, Forever) para reiniciá-lo.
  process.exit(1); // Sair em caso de uncaughtException
});


// --- Adiciona logs para sinais de término ---
let server; // Variável para armazenar a instância do servidor HTTP

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => {
    console.log(`${new Date().toISOString()} - [PROCESS] Sinal ${signal} recebido. Iniciando desligamento gracioso...`);

    // Lógica para desligamento gracioso aqui:
    // 1. Parar de aceitar novas conexões (o server.close() fará isso)
    // 2. Aguardar conexões existentes terminarem
    // 3. Fechar conexões com banco de dados, etc.

    // Se você capturou a instância do server em 'app.listen':
    if (server) {
      server.close((err) => {
        if (err) {
          console.error(`${new Date().toISOString()} - [PROCESS] Erro ao fechar servidor HTTP:`, err);
          process.exit(1); // Sair com erro
        }
        console.log(`${new Date().toISOString()} - [PROCESS] Servidor HTTP fechado.`);
        // Agora, feche outras conexões (DB, etc.) aqui
        // Por exemplo: db.sequelize.close();
        console.log(`${new Date().toISOString()} - [PROCESS] Conexões de banco de dados e outros serviços fechadas.`);
        process.exit(0); // Sair sem erro
      });
    } else {
       // Se a instância do server não foi capturada ou o server ainda não foi iniciado
        console.log(`${new Date().toISOString()} - [PROCESS] Instância do servidor não disponível ou não iniciada. Saindo imediatamente.`);
       process.exit(1); // Sair com erro (pois o server não fechou corretamente)
    }

     // Opcional: Adicionar um pequeno delay para tentar garantir que os logs saiam antes de process.exit()
     // Note: `server.close` já espera um pouco por conexões ativas. Um delay adicional pode ser útil para logs.
     // Mas cuidado para não interferir com o `server.close` callback.
     // setTimeout(() => { console.log("Force exiting..."); process.exit(server ? 0 : 1); }, 5000); // Exemplo: sair após 5s

  });
});

// Handler adicional para eventos de saída do processo (Este sempre é chamado no final)
process.on('exit', (code) => {
    console.log(`${new Date().toISOString()} - [PROCESS] Processo Node.js saindo com código: ${code}`);
    // Nota: Você *não* deve fazer operações assíncronas aqui, pois o loop de eventos já parou ou está parando.
    // Use os handlers SIGINT/SIGTERM/SIGQUIT para desligamento gracioso.
});

// --- TESTE: Adicionar um timer simples que *não* faz nada ---
// Este timer mantém o loop de eventos do Node.js ativo. Se seu aplicativo
// estava saindo prematuramente, este timer *deve* impedir isso.
// Em um aplicativo real, conexões de banco de dados abertas, sockets, etc.,
// também mantêm o loop de eventos ativo.
let keepAliveTimer = setInterval(() => {
    // console.log(`${new Date().toISOString()} - [DEBUG] Timer keep-alive ativo.`); // Descomente para ver o timer rodando
}, 60000); // Roda a cada 60 segundos. Mantenha-o rodando.


// --- Inicialização Assíncrona (BD e Servidor) ---
(async () => {
  try {
    console.log(`${new Date().toISOString()} - [STARTUP] Iniciando sequência de inicialização...`);

    console.log(`${new Date().toISOString()} - [STARTUP] Tentando conectar ao banco de dados...`);
    await db.sequelize.authenticate();
    console.log(`${new Date().toISOString()} - [STARTUP] Conexão com o banco de dados estabelecida com sucesso.`);

    // Sincroniza os modelos (USE APENAS EM DEV!)
    // ATENÇÃO: force: true VAI EXCLUIR E RECRIAR AS TABELAS, APAGANDO TODOS OS DADOS.
    // Use apenas em ambientes de desenvolvimento ou teste onde a perda de dados é aceitável.
    // Para produção, use Migrations!
    await db.sequelize.sync({ force: false }); // <-- Mantido force: false
    console.log(`${new Date().toISOString()} - Modelos sincronizados com o banco de dados (force: false).`);


    console.log(`${new Date().toISOString()} - [STARTUP] Tentando iniciar servidor Express na porta ${PORT}...`);
    server = app.listen(PORT, () => { // Capture a instância do server
      console.log(`${new Date().toISOString()} - [STARTUP] Servidor rodando na porta ${PORT} em ambiente ${process.env.NODE_ENV || 'development'}`);
      console.log(`${new Date().toISOString()} - [STARTUP] API pronta para receber requisições.`);
    });

    // Adicionar um handler de erro no server para capturar erros de baixo nível (socket, etc.)
    server.on('error', (error) => {
        console.error(`${new Date().toISOString()} - [SERVER ERROR] Erro no servidor HTTP:`, error);
        // Erros comuns aqui: EADDRINUSE (porta já em uso).
        // Em caso de EADDRINUSE, é melhor sair.
        if (error.code === 'EADDRINUSE') {
            console.error(`${new Date().toISOString()} - [FATAL STARTUP ERROR] Porta ${PORT} já está em uso. Encerrando.`);
            // Limpa o timer antes de sair
            clearInterval(keepAliveTimer);
            process.exit(1); // Sair com erro
        }
        // Para outros erros, dependendo da gravidade, pode ser necessário mais lógica.
    });


  } catch (error) {
    console.error(`${new Date().toISOString()} - [FATAL STARTUP ERROR] Erro fatal ao conectar ao banco de dados ou iniciar o servidor:`, error);
    // Certifique-se de que o timer seja limpo antes de sair em caso de erro fatal na inicialização.
    clearInterval(keepAliveTimer); // Limpa o timer
    process.exit(1); // Sair com erro
  }
})();


// Exporta o app (útil para testes)
module.exports = app;