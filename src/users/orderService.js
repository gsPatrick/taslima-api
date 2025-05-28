// src/services/orderService.js
const db = require('../models'); // Importa todos os modelos
const Order = db.Order;
const OrderItem = db.OrderItem;
const Product = db.Product; // Para incluir dados do produto nos OrderItems
const User = db.User; // Se OrderService precisar de dados do usuário associado, opcional

class OrderService {

  // Busca pedidos para um usuário específico com paginação, ordenação e filtros
  async findOrdersByUserId(userId, pagination = {}, sorter = {}, filters = {}) {
    console.log(`OrderService: Buscando pedidos para usuário ${userId} com `, {pagination, sorter, filters});

    // Define defaults para paginação
    const { current = 1, pageSize = 10 } = pagination;
    const offset = (current - 1) * pageSize;
    const limit = pageSize;

    // Define defaults e mapeia campos para ordenação
    const { field = 'created_at', order = 'desc' } = sorter; // Default: pedidos mais recentes
    // Validar campos de ordenação permitidos para a tabela Order
    const validOrderFields = ['created_at', 'total_amount', 'status']; // Exemplo de campos permitidos
    const orderField = validOrderFields.includes(field) ? field : 'created_at'; // Usa default se campo inválido
    const orderDirection = (order && (order.toLowerCase() === 'asc' || order.toLowerCase() === 'desc')) ? order.toUpperCase() : 'DESC'; // Usa default se direção inválida

    // Configuração de ordenação para Sequelize
    const orderArray = [[orderField, orderDirection]];

    // Condições de busca: sempre para o user_id especificado
    const where = {
      user_id: userId
    };

    // Adiciona filtro por status se fornecido e válido
    if (filters.status && typeof filters.status === 'string' && filters.status !== 'all') {
        // Assumimos que os valores de status do filtro correspondem aos do ENUM no modelo Order
        // Opcional: Validar se o status fornecido é um dos valores do ENUM ('pending_payment', 'paid', ...)
         const validStatuses = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
         if (validStatuses.includes(filters.status)) {
             where.status = filters.status;
         } else {
              console.warn(`OrderService: Status de filtro inválido fornecido: ${filters.status}`);
         }
    }
    // TODO: Adicionar outros filtros se necessário (ex: por data, por valor total)


    try {
      // Usa findAndCountAll para obter dados da página atual E o total de itens filtrados
      const result = await Order.findAndCountAll({
        where: where, // Usa a cláusula where construída
        limit: limit, // Limite de itens por página
        offset: offset, // Quantos itens pular (para a página atual)
        order: orderArray, // Configuração de ordenação

        // Inclui os itens do pedido associados e, opcionalmente, dados do produto para cada item
        include: [{
          model: OrderItem,
          as: 'items', // Usa o alias definido na associação (models/index.js)
          // Opcional: incluir dados do produto associado a cada item
          include: [{
             model: Product,
             as: 'product', // Alias da associação OrderItem -> Product
             attributes: ['product_id', 'name', 'image_url'] // Apenas alguns campos do produto
          }],
           // Opcional: atributos específicos para o OrderItem se não quiser todos
          // attributes: ['order_item_id', 'product_id', 'quantity', 'price_at_time', 'product_name_at_time']
        }],
        // Opcional: atributos específicos para a Ordem se não quiser todos os campos da tabela Order
        // attributes: ['order_id', 'status', 'total_amount', 'created_at', 'payment_method', 'shipping_address']
      });

      // O resultado de findAndCountAll é { count: totalRows, rows: currentRowsArray }
      return {
        data: result.rows, // A lista de pedidos paginados (objetos Order com 'items' incluído)
        total: result.count // O total de pedidos que correspondem aos filtros (em todas as páginas)
      };

    } catch (error) {
      console.error(`Erro no OrderService findOrdersByUserId (${userId}):`, error);
      // Relança o erro original para o controller decidir o status
      throw error;
    }
  }

  // TODO: Implementar função para buscar detalhes de um pedido específico
  async getOrderDetails(orderId, userId) {
      console.log(`OrderService: Buscando detalhes do pedido ${orderId} para usuário ${userId}`);
      try {
          const order = await Order.findOne({
              where: {
                  order_id: orderId,
                  user_id: userId // Garante que o pedido pertence ao usuário logado
              },
               // Inclui os itens do pedido e dados básicos do produto associado
              include: [{
                 model: OrderItem,
                 as: 'items',
                 include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['product_id', 'name', 'image_url', 'price'] // Inclui preço atual do produto (opcional)
                 }],
              }],
               // Inclui dados do usuário associado ao pedido (opcional, mas útil)
               include: [{
                   model: User,
                   as: 'user',
                   attributes: ['user_id', 'name', 'email', 'whatsapp_number'] // Campos básicos do usuário
               }]
               // Opcional: incluir payment_info, shipping_address se forem relevantes para a tela de detalhes
          });

          return order; // Retorna o objeto Order com detalhes ou null

      } catch (error) {
          console.error(`Erro no OrderService getOrderDetails (${orderId}, user ${userId}):`, error);
           throw error; // Relança o erro original
      }
  }

   // TODO: Implementar função para criar um novo pedido (geralmente após o checkout)
   // async createOrder(userId, cartItems, shippingInfo, paymentInfo) { ... }

}

module.exports = new OrderService(); // Exporta uma instância da classe