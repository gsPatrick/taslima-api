const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    order_item_id: {
        type: DataTypes.INTEGER, // Ou DataTypes.UUID
        primaryKey: true,
        autoIncrement: true, // Se usar INTEGER
        // defaultValue: DataTypes.UUIDV4, // Se usar UUID
        allowNull: false
    },
    order_id: {
        type: DataTypes.INTEGER, // Tipo da PK de Order (INT ou UUID)
        allowNull: false,
        references: {
            model: 'orders',
            key: 'order_id'
        }
    },
    product_id: {
        type: DataTypes.INTEGER, // Tipo da PK de Product (INT ou UUID)
        allowNull: false,
        references: {
            model: 'products',
            key: 'product_id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price_at_time: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    product_name_at_time: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'order_items',
    timestamps: false, // OrderItems não precisam de timestamps
    indexes: [
      { fields: ['order_id'] }
    ]
});

// Associações (serão definidas em models/index.js)
// OrderItem.associate = (models) => {
//   OrderItem.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
//   OrderItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
// };

module.exports = OrderItem;