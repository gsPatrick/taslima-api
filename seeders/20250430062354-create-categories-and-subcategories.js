'use strict';

/** @type {import('sequelize-cli').Migration} */

// Replicamos a estrutura de categorias do frontend para usar no seeder
// Garantindo que os IDs e slugs sejam os mesmos!
const categoryStructure = {
    "Medicamentos": { id: 1, slug: 'medicamentos', subs: [{ name: "Antibióticos", id: 101, slug: 'antibioticos' }, { name: "Anti-inflamatórios", id: 102, slug: 'anti-inflamatorios' }, { name: "Vermífugos", id: 103, slug: 'vermiFugos' }, { name: "Demais Medicamentos", id: 104, slug: 'demais-medicamentos' }, { name: "Mosquicidas e Carrapaticidas", id: 105, slug: 'mosquicidas-e-carrapaticidas' }, { name: "Mata Bicheira", id: 106, slug: 'mata-bicheira' }, { name: "Terapêuticos", id: 107, slug: 'terapeuticos' }, { name: "IATF", id: 108, slug: 'iatf' }, { name: "Outros", id: 109, slug: 'outros' }] },
    "Fertilizantes": { id: 2, slug: 'fertilizantes', subs: [{ name: "NPK", id: 201, slug: 'npk' }, { name: "Orgânicos", id: 202, slug: 'organicos' }, { name: "Foliares", id: 203, slug: 'foliares' }, { name: "Outros", id: 204, slug: 'outros' }] },
    "Defensivos": { id: 3, slug: 'defensivos', subs: [{ name: "Herbicidas", id: 301, slug: 'herbicidas' }, { name: "Inseticidas", id: 302, slug: 'inseticidas' }, { name: "Fungicidas", id: 303, slug: 'fungicidas' }, { name: "Outros", id: 304, slug: 'outros' }] },
    "Sementes": { id: 4, slug: 'sementes', subs: [{ name: "Milho", id: 401, slug: 'milho' }, { name: "Soja", id: 402, slug: 'soja' }, { name: "Hortaliças", id: 403, slug: 'hortalicas' }, { name: "Outros", id: 404, slug: 'outros' }] },
    "Equipamentos": { id: 5, slug: 'equipamentos', subs: [{ name: "Pulverizadores", id: 501, slug: 'pulverizadores' }, { name: "Ferramentas", id: 502, slug: 'ferramentas' }, { name: "Botas", id: 503, slug: 'botas' }, { name: "Outros", id: 504, slug: 'outros' }] },
    "Saúde Animal": { id: 6, slug: 'saude-animal', subs: [{ name: "Vermífugos", id: 601, slug: 'vermiFugos' }, { name: "Vacinas", id: 602, slug: 'vacinas' }, { name: "Acessórios", id: 603, slug: 'acessorios' }, { name: "Outros", id: 604, slug: 'outros' }] },
    "Fazenda": { id: 7, slug: 'fazenda', subs: [{ name: "Arames", id: 701, slug: 'arames' }, { name: "Cercas", id: 702, slug: 'cercas' }, { name: "Comedouros", id: 703, slug: 'comedouros' }, { name: "Alimentadores", id: 704, slug: 'alimentadores' }, { name: "Outros", id: 705, slug: 'outros' }] },
    "Pets": { id: 8, slug: 'pet', subs: [{ name: "Brinquedos", id: 801, slug: 'brinquedos' }, { name: "Coleiras", id: 802, slug: 'coleiras' }, { name: "Higiene", id: 803, slug: 'higiene' }, { name: "Outros", id: 804, slug: 'outros' }] },
     "Vestuário": { id: 9, slug: 'vestuario', subs: [{ name: 'Acessórios', id: 901, slug: 'acessorios' }, { name: 'Bonés', id: 902, slug: 'bones' }, { name: 'Botas', id: 903, slug: 'botas' }, { name: 'Botinas', id: 904, slug: 'botinas' }, { name: 'Carteira', id: 905, slug: 'carteira' }, { name: 'Chapéu', id: 906, slug: 'chapeu' }, { name: 'Cinto', id: 907, slug: 'cinto' }, { name: 'Outros', id: 908, slug: 'outros' }] },
      "Higienização e limpeza": { id: 10, slug: 'higienizacao-e-limpeza', subs: [{ name: 'Desinfetantes', id: 1001, slug: 'desinfetantes' }, { name: 'Detergentes', id: 1002, slug: 'detergentes' }, { name: 'Outros Químicos', id: 1003, slug: 'outros-quimicos' }] },
       "Ferragista": { id: 11, slug: 'ferragista', subs: [{ name: 'Acessórios para Ferramentas', id: 1101, slug: 'acessorios-para-ferramentas' }, { name: 'Bombas de Água', id: 1102, slug: 'bombas-de-agua' }, { name: 'Cabos Elétricos', id: 1103, slug: 'cabos-eletricos' }, { name: 'Carrinho de Mão', id: 1104, slug: 'carrinho-de-mao' }, { name: 'Canos e Tubos', id: 1105, slug: 'canos-e-tubos' }, { name: 'Conexões de Água', id: 1106, slug: 'conexoes-de-agua' }, { name: 'Conexões de Esgoto', id: 1107, slug: 'conexoes-de-esgoto' }, { name: 'Ferramentas a Bateria', id: 1108, slug: 'ferramentas-a-bateria' }, { name: 'Ferramentas Elétricas', id: 1109, slug: 'ferramentas-eletricas' }, { name: 'Ferramentas Manuais', id: 1110, slug: 'ferramentas-manuais' }, { name: 'Ralos e Sifões', id: 1111, slug: 'ralos-e-sifoes' }, { name: 'Registros', id: 1112, slug: 'registros' }, { name: 'Outros', id: 1113, slug: 'outros' }] },
        "Suplementos": { id: 12, slug: 'suplementos', subs: [{ name: 'Aves', id: 1201, slug: 'aves' }, { name: 'Bovinos', id: 1202, slug: 'bovinos' }, { name: 'Equinos', id: 1203, slug: 'equinos' }, { name: 'Suínos', id: 1204, slug: 'suinos' }, { name: 'Outros', id: 1205, slug: 'outros' }] },

};

// Função para converter a estrutura em arrays planos para inserção
const flattenCategoriesAndSubcategories = (structure) => {
  const categories = [];
  const subcategories = [];

  Object.values(structure).forEach(cat => {
    categories.push({
      category_id: cat.id, // Usa o ID definido
      name: Object.keys(structure).find(key => structure[key] === cat), // Pega o nome original
      slug: cat.slug,
      created_at: new Date(), // Adiciona data de criação
      // <<< CORREÇÃO AQUI: REMOVIDO updated_at para categories >>>
      // updated_at: new Date(), // Removido para coincidir com schema que tem updatedAt: false
    });

    cat.subs.forEach(sub => {
      subcategories.push({
        subcategory_id: sub.id, // Usa o ID definido
        category_id: cat.id,    // Referencia o ID da categoria pai
        name: sub.name,
        slug: sub.slug,
        created_at: new Date(), // Adiciona data de criação
         // updated_at não no schema Subcategory, não incluído aqui.
      });
    });
  });

  return { categories, subcategories };
};

const { categories, subcategories } = flattenCategoriesAndSubcategories(categoryStructure);


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Desabilita as verificações de chave estrangeira temporariamente
    // Isso PODE SER NECESSÁRIO dependendo do seu banco e se você estiver definindo IDs manualmente
    // Se você está usando SERIAL ou UUID gerado pelo banco, isso geralmente NÃO é necessário.
    // Como você teve erro de FK antes, pode ser que você esteja definindo IDs manualmente.
    // Se necessário, descomente a linha apropriada para o seu banco:
    // Para PostgreSQL:
    // await queryInterface.sequelize.query('SET session_replication_role = replica;');
    // Para MySQL:
    // await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');


    // Insere as categorias primeiro
    console.log("Inserindo categorias...");
    await queryInterface.bulkInsert('categories', categories, {
      // Opcional: ignoreDuplicates: true se você rodar o seeder múltiplas vezes
       ignoreDuplicates: true
       // Se você está definindo IDs manualmente e o banco não permite bulkInsert com PKs,
       // pode precisar inserir uma por uma ou ajustar a migração para permitir a inserção de PKs.
       // Para PostgreSQL, o bulkInsert geralmente aceita PKs.
       // Se o erro de PK duplicada persistir, a tabela 'categories' já pode ter dados ou a migração não a limpou.
    });
    console.log("Categorias inseridas.");


    // Insere as subcategorias
    console.log("Inserindo subcategorias...");
    await queryInterface.bulkInsert('subcategories', subcategories, {
       ignoreDuplicates: true
       // Se definindo IDs manualmente e o banco não permite, ver observação acima.
    });
    console.log("Subcategorias inseridas.");


    // Reabilita as verificações de chave estrangeira (se desabilitou antes)
    // Para PostgreSQL:
    // await queryInterface.sequelize.query('SET session_replication_role = default;');
    // Para MySQL:
    // await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

     console.log("Seeder de categorias e subcategorias concluído.");
  },

  async down (queryInterface, Sequelize) {
    // Desabilita as verificações de chave estrangeira temporariamente (se necessário para o down)
    // Para PostgreSQL:
    // await queryInterface.sequelize.query('SET session_replication_role = replica;');
    // Para MySQL:
    // await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');


    // Limpa as tabelas na ordem inversa das dependências para evitar erros de FK
    // (Produtos > OrderItems > Subcategorias > Categorias > Orders > Users se aplicável)
    // Como este seeder só cria categorias/subcategorias, basta removê-las, subcategorias primeiro.

    // Para remover dados específicos do seeder, você pode usar WHERE com IDs ou slugs.
    // Uma forma mais simples em down (para desenvolvimento) é limpar as tabelas populadas por este seeder.

    // Primeiro remove as subcategorias
     const subcategorySlugsToRemove = subcategories.map(sub => sub.slug);
     console.log(`Removendo subcategorias com slugs: ${subcategorySlugsToRemove.join(', ')}`);
     await queryInterface.bulkDelete('subcategories', {
         slug: subcategorySlugsToRemove
     }, {});
     console.log("Subcategorias removidas.");


    // Depois remove as categorias
     const categorySlugsToRemove = categories.map(cat => cat.slug);
     console.log(`Removendo categorias com slugs: ${categorySlugsToRemove.join(', ')}`);
     await queryInterface.bulkDelete('categories', {
         slug: categorySlugsToRemove
     }, {});
     console.log("Categorias removidas.");


    // Reabilita as verificações de chave estrangeira (se desabilitou antes)
    // Para PostgreSQL:
    // await queryInterface.sequelize.query('SET session_replication_role = default;');
    // Para MySQL:
    // await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log("Undo do seeder de categorias e subcategorias concluído.");
  }
};