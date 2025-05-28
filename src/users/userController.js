// src/controllers/userController.js
// Importa o service unificado
const userService = require('../users/userService');
// Não precisa importar OrderService aqui, pois UserService já faz isso

// Controller para registrar um novo usuário (role 'customer')
const register = async (req, res, next) => { // Adicionado 'next'
  const { name, email, password, whatsapp_number } = req.body;

  // Validação básica (melhor usar libs como Joi ou express-validator)
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }
   // Opcional: Validação básica do email e senha
   if (!/\S+@\S+\.\S+/.test(email)) { return res.status(400).json({ message: 'Formato de email inválido.' }); }
   if (password.length < 6) { return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres.' }); }


  try {
    const newUser = await userService.registerUser({ name, email, password, whatsapp_number });
    res.status(201).json(newUser); // 201 Created

  } catch (error) {
    if (error.message === 'Email já cadastrado.') {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    console.error('Erro no userController register:', error.message);
    // Para outros erros (ex: DB), passe para o middleware de erro global
    next(error); // Usa next(error)
  }
};

// Controller para registrar um novo usuário ADMIN (PROTEGIDO!)
const registerAdmin = async (req, res, next) => { // Adicionado 'next'
  const { name, email, password, whatsapp_number } = req.body;

  // Validação básica
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }
   // Opcional: Validação básica
   if (!/\S+@\S+\.\S+/.test(email)) { return res.status(400).json({ message: 'Formato de email inválido.' }); }
   if (password.length < 6) { return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres.' }); }


  try {
    // O service cria com role 'admin'
    const newAdminUser = await userService.registerAdmin({ name, email, password, whatsapp_number });
    res.status(201).json(newAdminUser); // 201 Created

  } catch (error) {
     if (error.message === 'Email já cadastrado.') {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    console.error('Erro no userController registerAdmin:', error.message);
     next(error); // Usa next(error)
  }
};


// Controller para login (para qualquer role)
const login = async (req, res, next) => { // Adicionado 'next'
  const { email, password } = req.body;

  // Validação básica
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }
   // Opcional: Validação básica do email
   if (!/\S+@\S+\.\S+/.test(email)) { return res.status(400).json({ message: 'Formato de email inválido.' }); }


  try {
    // O service lida com a autenticação e geração do token
    const { user, token } = await userService.login({ email, password });
    // Retorna o usuário (sem hash) e o token JWT
    res.status(200).json({ user, token }); // 200 OK

  } catch (error) {
    // O service já lança o erro específico de credenciais inválidas
    if (error.message === 'Credenciais inválidas.') {
      return res.status(401).json({ message: error.message }); // 401 Unauthorized
    }
    console.error('Erro no userController login:', error.message);
    next(error); // Para outros erros (ex: DB), passe para o middleware
  }
};


// Controller para obter os detalhes do usuário autenticado (GET /api/v1/me)
// Requer authMiddleware aplicado antes
const getAuthenticatedUser = async (req, res, next) => {
  // O middleware authMiddleware já verificou o token, buscou o usuário no DB
  // e anexou o objeto User (sem password_hash) em req.user.
  // Se req.user existe, a autenticação foi bem-sucedida.

  if (!req.user) {
    // Isso não deve acontecer se o middleware estiver correto,
    // mas é um fallback seguro.
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  try {
    // req.user já contém os dados do usuário (sem hash).
    // Podemos retornar diretamente req.user.
    // Opcional: buscar novamente pelo ID para garantir os dados mais recentes,
    // mas geralmente req.user já é suficiente após o middleware.
    const userDetails = await userService.findUserById(req.user.user_id);
     if (!userDetails) {
         // Improvável, mas tratar o caso de o usuário ter sido deletado após o middleware
         const error = new Error('Usuário autenticado não encontrado.');
         error.status = 404; return next(error);
     }


    res.status(200).json(userDetails); // Retorna os detalhes do usuário logado

  } catch (error) {
    console.error('Erro no userController getAuthenticatedUser:', error.message);
    next(error); // Passa para o middleware de erro global
  }
};


// Controller para atualizar dados do usuário autenticado (PUT /api/v1/me)
// Requer authMiddleware aplicado antes
const updateAuthenticatedUser = async (req, res, next) => {
    // O middleware authMiddleware já verificou e anexou req.user
    const userId = req.user.user_id;
    const updateData = req.body; // Dados para atualização no corpo da requisição

    // Validação básica dos dados recebidos (opcional mas recomendado)
    // Ex: if (updateData.name !== undefined && typeof updateData.name !== 'string') { ... }
    // Evite permitir que a role, email, password_hash sejam atualizados por aqui sem validação específica

    try {
        const updatedUser = await userService.updateUser(userId, updateData);

        if (!updatedUser) {
            // Se o service retornar null (usuário não encontrado para update, improvável)
            const error = new Error('Usuário autenticado não encontrado para atualização.');
            error.status = 404;
            return next(error);
        }

         res.status(200).json(updatedUser); // Retorna o usuário atualizado (sem hash)

    } catch (error) {
        console.error('Erro no userController updateAuthenticatedUser:', error.message);
        // O service já lança erros específicos como 'Email já cadastrado.'
         if (error.message === 'Email já cadastrado.') {
             return res.status(409).json({ message: error.message });
         }
        next(error); // Passa para o middleware de erro global para outros erros
    }
};


// Controller para obter os pedidos do usuário autenticado (GET /api/v1/me/orders)
// Requer authMiddleware aplicado antes
const getAuthenticatedUserOrders = async (req, res, next) => {
  // O middleware authMiddleware já verificou e anexou req.user
  const userId = req.user.user_id;

  // Parâmetros de paginação, ordenação e filtro dos query parameters
  const { page, pageSize, sortBy, order, status } = req.query;

  const pagination = {
      current: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 10 // Default 10 pedidos por página
  };

  const sorter = {
      field: sortBy || 'created_at', // Default sort by creation date
      order: order || 'desc' // Default order desc
  };

  const filters = {
      status: status // Passa o status do query param para o service
      // TODO: Adicionar outros filtros se necessário
  };

  try {
    // Chama o userService (que chama orderService) para buscar os pedidos
    const result = await userService.findOrdersByUserId(userId, pagination, sorter, filters);

    // O service findOrdersByUserId deve retornar { data: [...pedidos_paginados], total: total_filtrado }
    // O formato da resposta para o frontend já está correto { data: [], total: 0 } ou { data: [...], total: ... }

    res.status(200).json(result); // Retorna a lista paginada de pedidos e o total

  } catch (error) {
    console.error('Erro no userController getAuthenticatedUserOrders:', error.message);
    next(error); // Passa para o middleware de erro global
  }
};

// TODO: Adicionar outros controllers para user (ex: change password)


// Exporta todos os controllers unificados
module.exports = {
  // Authentication
  register,
  registerAdmin, // Lembre-se de proteger esta rota em produção!
  login,
  // User Management (Requires Auth)
  getAuthenticatedUser,
  updateAuthenticatedUser,
  getAuthenticatedUserOrders,
};