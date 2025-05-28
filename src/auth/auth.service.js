// src/auth/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models'); // Importa todos os modelos do index.js
const User = db.User; // Acessa o modelo User

// Recomendado: Usar uma variável de ambiente para a chave secreta do JWT
// Ex: process.env.JWT_SECRET || 'sua_chave_secreta_padrao'
const JWT_SECRET = process.env.JWT_SECRET || 'supersegredodoseuecommercenaocompartilhe'; // <<< MUDAR EM PRODUCAO!

class AuthService {

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
      // Verifica se é erro de email duplicado (código 23505 do PostgreSQL)
      if (error.name === 'SequelizeUniqueConstraintError' || (error.parent && error.parent.code === '23505')) {
        throw new Error('Email já cadastrado.');
      }
      console.error('Erro ao registrar usuário:', error);
      throw new Error('Erro interno ao registrar usuário.');
    }
  }

  async registerAdmin({ name, email, password, whatsapp_number }) {
    // Lógica para registrar um admin
    // Em um sistema real, você poderia querer garantir que apenas um admin
    // inicial possa ser criado assim, ou que apenas admins existentes possam criar outros.
    // Para simplificar agora, este endpoint apenas cria um usuário com role 'admin'.
    const password_hash = await bcrypt.hash(password, 10); // 10 é o saltRounds

    try {
      const adminUser = await User.create({
        name,
        email,
        password_hash,
        whatsapp_number,
        role: 'admin' // Define a role como admin
      });
      // Retorna o usuário admin criado, excluindo o hash da senha por segurança
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
      // Encontra o usuário pelo email
      const user = await User.findOne({ where: { email } });

      if (!user) {
        // Usuário não encontrado
        throw new Error('Credenciais inválidas.');
      }

      // Compara a senha fornecida com o hash armazenado
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        // Senha incorreta
        throw new Error('Credenciais inválidas.');
      }

      // Gera o token JWT
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email, role: user.role }, // Payload do token
        JWT_SECRET, // Chave secreta
        { expiresIn: '1h' } // Opcional: tempo de expiração
      );

      // Retorna informações do usuário (sem hash) e o token
      const userWithoutHash = user.toJSON();
      delete userWithoutHash.password_hash;

      return { user: userWithoutHash, token };

    } catch (error) {
      // Se o erro for de 'Credenciais inválidas', relança. Outros erros são internos.
      if (error.message === 'Credenciais inválidas.') {
         throw error; // Relança o erro específico de credenciais
      }
      console.error('Erro ao fazer login:', error);
      throw new Error('Erro interno ao fazer login.');
    }
  }
}

module.exports = new AuthService(); // Exporta uma instância da classe