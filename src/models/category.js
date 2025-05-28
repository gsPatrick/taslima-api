const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    category_id: {
        type: DataTypes.INTEGER, // Ou DataTypes.UUID
        primaryKey: true,
        autoIncrement: true, // Se usar INTEGER
        // defaultValue: DataTypes.UUIDV4, // Se usar UUID
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Apenas created_at no schema
});

// Associações (serão definidas em models/index.js)
// Category.associate = (models) => {
//   Category.hasMany(models.Subcategory, { foreignKey: 'category_id', as: 'subcategories' });
//   Category.hasMany(models.Product, { foreignKey: 'category_id', as: 'products' });
// };

module.exports = Category;