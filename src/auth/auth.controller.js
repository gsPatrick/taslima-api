// src/auth/auth.controller.js
const authService = require('./auth.service');

// Controller para registrar um novo usuário (role 'customer')
const register = async (req, res) => {
  const { name, email, password, whatsapp_number } = req.body;

  // Validação básica (melhor usar libs como Joi ou express-validator)
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const newUser = await authService.registerUser({ name, email, password, whatsapp_number });
    res.status(201).json(newUser); // 201 Created

  } catch (error) {
    if (error.message === 'Email já cadastrado.') {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    console.error('Erro no controller register:', error.message);
    res.status(500).json({ message: 'Erro ao registrar usuário.' }); // 500 Internal Server Error
  }
};

// Controller para registrar um novo usuário ADMIN
const registerAdmin = async (req, res) => {
  const { name, email, password, whatsapp_number } = req.body;

  // Validação básica
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const newAdminUser = await authService.registerAdmin({ name, email, password, whatsapp_number });
    res.status(201).json(newAdminUser); // 201 Created

  } catch (error) {
     if (error.message === 'Email já cadastrado.') {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    console.error('Erro no controller registerAdmin:', error.message);
    res.status(500).json({ message: 'Erro ao registrar admin.' }); // 500 Internal Server Error
  }
};


// Controller para login
const login = async (req, res) => {
  const { email, password } = req.body;

  // Validação básica
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const { user, token } = await authService.login({ email, password });
    // Retorna o usuário e o token JWT
    res.status(200).json({ user, token }); // 200 OK

  } catch (error) {
    if (error.message === 'Credenciais inválidas.') {
      return res.status(401).json({ message: error.message }); // 401 Unauthorized
    }
    console.error('Erro no controller login:', error.message);
    res.status(500).json({ message: 'Erro ao fazer login.' }); // 500 Internal Server Error
  }
};

module.exports = {
  register,
  registerAdmin,
  login,
};