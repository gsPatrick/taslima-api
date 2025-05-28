
// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
// Importa o controller unificado
const userController = require('../users/userController');
// Importa os middlewares de autenticação/verificação
const { authMiddleware, adminCheckMiddleware } = require('../middleware/authMiddleware');


// --- Rotas de Autenticação (/api/v1/auth/...) ---

// POST /api/v1/auth/register - Registrar um novo usuário (customer)
router.post('/auth/register', userController.register);

// POST /api/v1/auth/register-admin - Registrar um novo usuário ADMIN
// ATENCAO: Este endpoint deve ser PROTEGIDO em ambientes reais!
// Ex: acessível apenas por um admin já autenticado.
// Por enquanto, para facilitar o setup inicial, deixamos sem middleware aqui,
// mas proteja-o assim que tiver o primeiro admin criado.
router.post('/auth/register-admin', userController.registerAdmin);
// Exemplo de como proteger se quiser que apenas admin já autenticado possa criar outro:
// router.post('/auth/register-admin', [authMiddleware, adminCheckMiddleware], userController.registerAdmin);


// POST /api/v1/auth/login - Fazer login
router.post('/auth/login', userController.login);


// --- Rotas do Usuário Autenticado (/api/v1/me/...) ---
// Todas essas rotas requerem que o usuário esteja logado (aplicando authMiddleware)

// GET /api/v1/me - Obter detalhes do usuário logado
router.get('/me', authMiddleware, userController.getAuthenticatedUser);

// PUT /api/v1/me - Atualizar dados do usuário logado
router.put('/me', authMiddleware, userController.updateAuthenticatedUser);

// GET /api/v1/me/orders - Obter pedidos do usuário logado (com filtros/paginação/ordenação)
router.get('/me/orders', authMiddleware, userController.getAuthenticatedUserOrders);


// TODO: Adicionar outras rotas de usuário se necessário (ex: /me/addresses, /me/change-password)


module.exports = router;