const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER, // Ou DataTypes.UUID
        primaryKey: true,
        autoIncrement: true, // Se usar INTEGER
        // defaultValue: DataTypes.UUIDV4, // Se usar UUID
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    whatsapp_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('customer', 'admin'),
        allowNull: false,
        defaultValue: 'customer'
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

// Associações (serão definidas em models/index.js)
// User.associate = (models) => {
//   User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
// };

module.exports = User;