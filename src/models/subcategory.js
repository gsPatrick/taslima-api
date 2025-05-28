const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subcategory = sequelize.define('Subcategory', {
    subcategory_id: {
        type: DataTypes.INTEGER, // Ou DataTypes.UUID
        primaryKey: true,
        autoIncrement: true, // Se usar INTEGER
        // defaultValue: DataTypes.UUIDV4, // Se usar UUID
        allowNull: false
    },
    category_id: {
        type: DataTypes.INTEGER, // Tipo da PK de Category (INT ou UUID)
        allowNull: false,
        references: {
            model: 'categories', // Nome da tabela referenciada
            key: 'category_id' // Nome da coluna referenciada
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'subcategories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Apenas created_at no schema
    indexes: [
      {
        unique: true,
        fields: ['category_id', 'slug'] // Unicidade composta
      },
      {
        fields: ['category_id'] // Índice na FK
      }
    ]
});

// Associações (serão definidas em models/index.js)
// Subcategory.associate = (models) => {
//   Subcategory.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
//   Subcategory.hasMany(models.Product, { foreignKey: 'subcategory_id', as: 'products' });
// };

module.exports = Subcategory;