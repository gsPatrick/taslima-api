// src/models/index.js
'use strict';

// Importa a instância do Sequelize do nosso arquivo de configuração
// O caminho é ../../config/database porque index.js está em src/models
const sequelize = require('../config/database');
const db = {};

// Importa explicitamente cada arquivo de modelo
// O require('./...') funciona porque todos os arquivos estão na mesma pasta ./src/models
db.User = require('./user');
db.Category = require('./category');
db.Subcategory = require('./subcategory');
db.Product = require('./product');
db.Order = require('./order');
db.OrderItem = require('./orderItem');

// Agora que todos os modelos estão carregados no objeto 'db',
// podemos definir as associações entre eles.
// O método .associate que estava antes na definição do modelo
// não é usado neste padrão direto com sequelize.define.

// Associações
db.User.hasMany(db.Order, { foreignKey: 'user_id', as: 'orders' });

db.Category.hasMany(db.Subcategory, { foreignKey: 'category_id', as: 'subcategories' });
db.Category.hasMany(db.Product, { foreignKey: 'category_id', as: 'products' });

db.Subcategory.belongsTo(db.Category, { foreignKey: 'category_id', as: 'category' });
db.Subcategory.hasMany(db.Product, { foreignKey: 'subcategory_id', as: 'products' });

db.Product.belongsTo(db.Category, { foreignKey: 'category_id', as: 'category' });
db.Product.belongsTo(db.Subcategory, { foreignKey: 'subcategory_id', as: 'subcategory' });

db.Order.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id', as: 'items' });

db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id', as: 'order' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'product_id', as: 'product' });


// Adiciona a instância do sequelize e a classe Sequelize ao objeto db exportado
db.sequelize = sequelize;
// Removendo a linha db.Sequelize = Sequelize; pois não está sendo usada e não é necessária.
// Se precisar da classe Sequelize (não da instância), importe no arquivo onde for usar.

module.exports = db;