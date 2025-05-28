const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    order_id: {
        type: DataTypes.INTEGER, // Ou DataTypes.UUID
        primaryKey: true,
        autoIncrement: true, // Se usar INTEGER
        // defaultValue: DataTypes.UUIDV4, // Se usar UUID
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER, // Tipo da PK de User (INT ou UUID)
        allowNull: true,
        references: {
            model: 'users',
            key: 'user_id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending_payment'
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_gateway_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payment_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    payer_info: {
        type: DataTypes.JSONB, // Para PostgreSQL
        allowNull: true
    },
    shipping_address: {
        type: DataTypes.JSONB, // Para PostgreSQL
        allowNull: true
    },
}, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
    ]
});

// Associações (serão definidas em models/index.js)
// Order.associate = (models) => {
//   Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
//   Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
// };

module.exports = Order;