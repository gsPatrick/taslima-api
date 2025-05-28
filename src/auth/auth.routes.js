// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// Rota para registrar um novo usuário (customer)
router.post('/register', authController.register);

// Rota para registrar um novo usuário ADMIN
// ATENCAO: Este endpoint deve ser PROTEGIDO em ambientes reais!
// Por exemplo, acessível apenas em desenvolvimento, ou apenas por um admin já autenticado.
router.post('/register-admin', authController.registerAdmin);

// Rota para login
router.post('/login', authController.login);


module.exports = router;