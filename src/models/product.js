const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    product_id: {
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
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    original_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    sku: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.STRING), // Para PostgreSQL
        allowNull: true
    },
    category_id: {
        type: DataTypes.INTEGER, // Tipo da PK de Category (INT ou UUID)
        allowNull: true,
        references: {
            model: 'categories',
            key: 'category_id'
        }
    },
    subcategory_id: {
        type: DataTypes.INTEGER, // Tipo da PK de Subcategory (INT ou UUID)
        allowNull: true,
        references: {
            model: 'subcategories',
            key: 'subcategory_id'
        }
    },
    specs: {
        type: DataTypes.JSONB, // Para PostgreSQL
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
}, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['name'] },
      { fields: ['category_id'] },
      { fields: ['subcategory_id'] },
      { fields: ['is_active'] },
    ]
});

// Associações (serão definidas em models/index.js)
// Product.associate = (models) => {
//   Product.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
//   Product.belongsTo(models.Subcategory, { foreignKey: 'subcategory_id', as: 'subcategory' });
// };

module.exports = Product;