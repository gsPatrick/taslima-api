// src/services/userService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models'); // Importa todos os modelos
const User = db.User;
const Order = db.Order;
const OrderItem = db.OrderItem;
const Product = db.Product;

// Importa OrderService, pois userService precisa dele para buscar pedidos
const orderService = require('./orderService');

// Recomendado: Usar uma variável de ambiente para a chave secreta do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'supersegredodoseuecommercenaocompartilhe'; // <<< MUDAR EM PRODUCAO!


class UserService {

  // --- Funções de Autenticação ---

  async registerUser({ name, email, password, whatsapp_number }) {
    const password_hash = await bcrypt.hash(password, 10); // 10 é o saltRounds

    try {
      const user = await User.create({
        name,
        email,
        password_hash,
        whatsapp_number,
        role: 'customer' // Padrão para registro normal
      });
      // Retorna o usuário criado, excluindo o hash da senha por segurança
      const userWithoutHash = user.toJSON();
      delete userWithoutHash.password_hash;
      return userWithoutHash;

    } catch (error) {
      // Verifica se é erro de email duplicado (código 23505 do PostgreSQL ou similar)
      if (error.name === 'SequelizeUniqueConstraintError' || (error.parent && error.parent.code === '23505')) {
        throw new Error('Email já cadastrado.');
      }
      console.error('Erro ao registrar usuário:', error);
      throw new Error('Erro interno ao registrar usuário.');
    }
  }

  async registerAdmin({ name, email, password, whatsapp_number }) {
    // Lógica para registrar um admin
    // Em um sistema real, proteja este endpoint!
    const password_hash = await bcrypt.hash(password, 10);

    try {
      const adminUser = await User.create({
        name,
        email,
        password_hash,
        whatsapp_number,
        role: 'admin' // Define a role como admin
      });
      const adminUserWithoutHash = adminUser.toJSON();
      delete adminUserWithoutHash.password_hash;
      return adminUserWithoutHash;

    } catch (error) {
       if (error.name === 'SequelizeUniqueConstraintError' || (error.parent && error.parent.code === '23505')) {
        throw new Error('Email já cadastrado.');
      }
      console.error('Erro ao registrar admin:', error);
      throw new Error('Erro interno ao registrar admin.');
    }
  }


  async login({ email, password }) {
    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw new Error('Credenciais inválidas.');
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        throw new Error('Credenciais inválidas.');
      }

      // Gera o token JWT
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, role: user.role }, // Payload mínimo
        JWT_SECRET,
        { expiresIn: '1h' } // Opcional: tempo de expiração
      );

      const userWithoutHash = user.toJSON();
      delete userWithoutHash.password_hash;

      return { user: userWithoutHash, token }; // Retorna usuário (sem hash) e token

    } catch (error) {
      if (error.message === 'Credenciais inválidas.') {
         throw error;
      }
      console.error('Erro ao fazer login:', error);
      throw new Error('Erro interno ao fazer login.');
    }
  }

  // --- Funções de Gerenciamento do Usuário Logado ---

   // Busca um usuário pelo ID, excluindo campos sensíveis
  async findUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] } // Exclui o hash da senha
      });
      return user; // Retorna o objeto User ou null
    } catch (error) {
      console.error(`Erro no UserService findUserById (${userId}):`, error);
      // Não relança erro genérico, deixa o controller decidir o status
      throw error;
    }
  }

  // Atualiza dados do usuário
  async updateUser(userId, updateData) {
      try {
          const user = await User.findByPk(userId);
          if (!user) return null; // Usuário não encontrado

          // Atualiza apenas campos permitidos (evite atualizar role, password_hash, etc. aqui)
          const allowedFields = ['name', 'whatsapp_number', 'address']; // Exemplo de campos permitidos
          const dataToUpdate = {};
          allowedFields.forEach(field => {
              // Verifica se o campo existe nos dados recebidos E não é undefined
              if (updateData.hasOwnProperty(field)) {
                   // Lógica especial para 'address': merge JSONB ou substitui
                   if (field === 'address' && user.address && updateData.address && typeof user.address === 'object' && typeof updateData.address === 'object') {
                       dataToUpdate[field] = { ...user.address, ...updateData.address }; // Merge de objetos address existentes
                   } else if (field === 'address' && updateData.address !== undefined) {
                        // Se o endereço existente é nulo ou não objeto, ou o updateData.address não é objeto, substitui
                        dataToUpdate[field] = updateData.address;
                   }
                   else if (field !== 'address') {
                        dataToUpdate[field] = updateData[field]; // Substitui para outros campos
                   }
              }
          });

           // Se o email vier nos dados, pode precisar de lógica de verificação (se único, etc.)
           // if (updateData.email !== undefined) { ... }

          await user.update(dataToUpdate);
          // Recarrega para ter os dados mais recentes (incluindo o address merged)
          await user.reload({
              attributes: { exclude: ['password_hash'] } // Exclui o hash da senha
          });
          return user; // Retorna o usuário atualizado

      } catch (error) {
          console.error(`Erro no UserService updateUser (${userId}):`, error);
          // Pode verificar erros de unicidade para email, etc.
          if (error.name === 'SequelizeUniqueConstraintError' || (error.parent && error.parent.code === '23505')) {
              throw new Error('Email já cadastrado.'); // Exemplo
          }
          // Para outros erros, relança o erro original para o controller
          throw error;
      }
  }

  // TODO: Adicionar função para alterar senha (requer hash e verificação da senha antiga)
  // async changePassword(userId, oldPassword, newPassword) { ... }


  // --- Funções de Pedidos (Chamando OrderService) ---
  // Reutiliza a função de OrderService aqui
  async findOrdersByUserId(userId, pagination, sorter, filters) {
      // Chama diretamente o OrderService que lida com a lógica de pedidos
      return orderService.findOrdersByUserId(userId, pagination, sorter, filters);
  }

  // TODO: Adicionar função para buscar detalhes de um pedido específico (Chamando OrderService)
  // async getOrderDetails(orderId, userId) { ... } // Opcional: verificar se o pedido pertence ao user_id
}

module.exports = new UserService(); // Exporta uma instância da classe