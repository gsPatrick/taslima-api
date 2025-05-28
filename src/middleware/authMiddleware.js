// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User; // Acessa o modelo User

const JWT_SECRET = process.env.JWT_SECRET || 'supersegredodoseuecommercenaocompartilhe'; // Use a mesma chave do auth.service.js

// Middleware genérico para verificar autenticação JWT
const authMiddleware = async (req, res, next) => {
  // 1. Obter o token do cabeçalho Authorization
  const authHeader = req.headers['authorization'];
  // Espera o formato "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // Se não houver token, retorna 401 Unauthorized
    return res.status(401).json({ message: 'Autenticação necessária: Token JWT não fornecido.' });
  }

  // 2. Verificar o token
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      // Se o token for inválido ou expirou
      console.error('Erro na verificação do token JWT:', err.message);
      return res.status(403).json({ message: 'Token JWT inválido ou expirado.' }); // 403 Forbidden ou 401 dependendo da sua preferência
    }

    // Token válido, extrair informações do payload (decoded)
    const userId = decoded.user_id;

    // 3. Buscar o usuário no banco de dados (boa prática)
    // Garante que o usuário ainda existe e não foi desativado
    try {
      const user = await User.findByPk(userId, {
         attributes: { exclude: ['password_hash'] } // Exclui o hash da senha
      });

      if (!user) {
        // Usuário não encontrado no DB, embora o token fosse válido
         console.warn(`Usuário com ID ${userId} do token não encontrado no DB.`);
        return res.status(401).json({ message: 'Usuário do token não encontrado.' });
      }

      // 4. Anexar o objeto do usuário à requisição
      req.user = user; // Agora você pode acessar o usuário autenticado em req.user

      // 5. Continuar para o próximo middleware/controller
      next();

    } catch (dbError) {
       console.error(`Erro ao buscar usuário (${userId}) no DB durante autenticação:`, dbError);
       // Erro no DB durante a busca
       return res.status(500).json({ message: 'Erro interno ao buscar usuário autenticado.' });
    }

  });
};

// Middleware para verificar se o usuário autenticado é Admin
const adminCheckMiddleware = (req, res, next) => {
    // authMiddleware já anexou req.user
    if (!req.user || req.user.role !== 'admin') {
        // Se não há usuário logado ou a role não é 'admin'
        return res.status(403).json({ message: 'Acesso negado: Requer privilégios de administrador.' }); // 403 Forbidden
    }
    // Se for admin, continua
    next();
};


module.exports = {
    authMiddleware,
    adminCheckMiddleware
};