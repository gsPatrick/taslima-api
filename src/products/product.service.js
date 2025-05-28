// src/products/product.service.js
// This service layer handles database interactions using Sequelize.
// It receives filtered/paginated/sorted parameters from the controller
// and executes the appropriate Sequelize queries.

const db = require('../models'); // Assuming your models setup is correct (e.g., index.js exports models)
const Product = db.Product; // Get the Product model definition
const { Op } = require('sequelize'); // Import Sequelize Operators for query conditions


class ProductService {

  // Create a new product record in the database.
  // productData should be an object containing the product details.
  async createProduct(productData) {
    console.log('Service createProduct received data:', productData); // Log data received by service
    try {
      // Use Sequelize's create method to insert a new row based on the model.
      // Sequelize maps keys in productData to model attributes.
      // Ensure your Product model handles timestamps, UUIDs, defaults, etc.
      const newProduct = await Product.create(productData);
      console.log('Service createProduct success, created product ID:', newProduct.product_id); // Log successful creation ID
      return newProduct; // Return the newly created product instance

    } catch (error) {
       // Catch specific Sequelize errors for better error reporting.
       // SequelizeUniqueConstraintError occurs for unique fields like slug or SKU.
       if (error.name === 'SequelizeUniqueConstraintError' || (error.parent && error.parent.code === '23505')) {
            console.warn('Service createProduct: Caught Sequelize Unique Constraint Error', error.errors); // Log the specific error details
            // Extract the field name from the error details to provide a helpful message.
            const field = error.errors[0]?.path || 'campo';
            // Throw a specific error message that the controller can catch and format for the frontend.
            throw new Error(`Valor duplicado para o campo '${field}'.`);
        }
       // SequelizeValidationError occurs for validation issues (e.g., notNull constraint failed, custom validators).
       if (error.name === 'SequelizeValidationError') {
            console.warn('Service createProduct: Caught Sequelize Validation Error', error); // Log validation errors
            const validationErrors = error.errors.map(err => err.message).join(', ');
            throw new Error(`Erro de validação: ${validationErrors}`);
        }
      // For any other unexpected errors during creation.
      console.error('Erro inesperado no service createProduct:', error); // Log the full error object
      // Throw a generic internal error message.
      throw new Error('Erro interno ao criar produto.');
    }
  }

  // Get a list of products with filters, pagination, and sorting.
  // This method is designed to be flexible and is used by the controller.
  // Depending on the 'filters' object received, it can fetch all products (for admin)
  // or filtered lists (for public site, search, category pages, etc.).
  async getAllProducts(filters = {}, pagination = { current: 1, pageSize: 10 }, sorter = null) {
    // Log the exact parameters received from the controller for debugging.
    console.log('Service getAllProducts received filters:', filters, 'pagination:', pagination, 'sorter:', sorter);

    try {
      const whereConditions = {}; // Object to build the Sequelize WHERE clause dynamically.

      // --- Apply Filters ---
      // Apply the 'is_active' filter ONLY IF it is explicitly defined in the filters object.
      // If filters.is_active is undefined (e.g., when frontend Admin filter is 'all'),
      // we DO NOT add an is_active condition, allowing Sequelize to fetch all products regardless of status.
      // If filters.is_active is true or false (frontend filter is 'Active' or 'Inactive'),
      // we add the corresponding boolean condition.
      if (filters.is_active !== undefined) {
          whereConditions.is_active = filters.is_active; // Use the boolean value passed from controller
          console.log(`Service getAllProducts: Applying is_active filter: ${whereConditions.is_active}`);
      } else {
          console.log('Service getAllProducts: No is_active filter specified in filters.');
          // If this endpoint is also used for the *public* view which *always* shows only active,
          // and the controller doesn't pass `is_active: true` for public requests,
          // you'd need a way to differentiate requests (e.g., a 'forAdmin' flag) or a separate public list service method.
          // For AdminProductsPage, leaving `is_active` undefined when filter is 'all' is correct.
      }

      // Add other filters from the filters object to the whereConditions.
      if (filters.minPrice !== undefined) {
          // Use spread syntax to add Op.gte operator to the 'price' object in whereConditions.
          whereConditions.price = { ...whereConditions.price, [Op.gte]: filters.minPrice };
      }
      if (filters.maxPrice !== undefined) {
           // Use spread syntax to add Op.lte operator to the existing 'price' object.
          whereConditions.price = { ...whereConditions.price, [Op.lte]: filters.maxPrice };
      }

       if (filters.q) {
            // Add a text search filter using Op.or (OR condition) and Op.iLike (case-insensitive LIKE for PostgreSQL).
            // Adjust the fields ('name', 'description', 'sku') based on where you want search to apply.
             whereConditions[Op.or] = [
                 { name: { [Op.iLike]: `%${filters.q}%` } },
                 { description: { [Op.iLike]: `%${filters.q}%` } },
                 // Include SKU in search if needed
                 { sku: { [Op.iLike]: `%${filters.q}%` } }
             ];
       }

       // Add category filter using Op.in (IN operator).
       if (filters.categoryIds && Array.isArray(filters.categoryIds) && filters.categoryIds.length > 0) {
           whereConditions.category_id = { [Op.in]: filters.categoryIds };
       }
       // Add subcategory filter using Op.in.
        if (filters.subcategoryIds && Array.isArray(filters.subcategoryIds) && filters.subcategoryIds.length > 0) {
           whereConditions.subcategory_id = { [Op.in]: filters.subcategoryIds };
       }
       // Add other filters here as needed...


      // --- Handle Pagination ---
      // Parse and validate pagination properties, using defaults if invalid.
      const limit = parseInt(pagination.pageSize, 10);
      const page = parseInt(pagination.current, 10);

      // Calculate limit and offset for the Sequelize query.
      const calculatedLimit = !isNaN(limit) && limit > 0 ? limit : 10; // Default limit is 10 items per page
      const calculatedPage = !isNaN(page) && page > 0 ? page : 1;       // Default page is 1
      const offset = (calculatedPage - 1) * calculatedLimit;
      if (offset < 0) offset = 0; // Ensure offset is never negative (shouldn't happen with page >= 1, but defensive)


      // --- Handle Sorting ---
      const orderConditions = []; // Array to build the Sequelize ORDER clause (e.g., [['name', 'ASC'], ['id', 'ASC']])

      // Add the primary sort field based on the sorter object.
      if (sorter && sorter.field) {
           const dbField = sorter.field; // Assuming frontend field name matches DB column name
           // Ensure order direction is 'ASC' or 'DESC'.
           const direction = sorter.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            orderConditions.push([dbField, direction]);
      } else {
           // If no valid sorter is provided, apply a default sort.
           // This default matches the frontend's default sort for recent products.
           orderConditions.push(['created_at', 'DESC']);
      }
      // Add a secondary sort by 'product_id' for stable pagination order.
      // This is important if the primary sort field might have duplicate values (e.g., multiple products created at the exact same timestamp).
      // Ensure we don't add 'product_id' as a secondary sort if it's already the primary sort field.
       if (!orderConditions.find(condition => condition[0] === 'product_id')) {
            orderConditions.push(['product_id', 'ASC']); // Ensures consistent order for items with same primary sort value
       }

       // Log the final query options being passed to Sequelize for transparency.
       console.log('Service getAllProducts final query options - where:', whereConditions, 'limit:', calculatedLimit, 'offset:', offset, 'order:', orderConditions);


      // Execute the database query using Sequelize's findAndCountAll method.
      // findAndCountAll is efficient as it performs two queries: one for the count
      // (ignoring limit/offset) and one for the data for the current page.
      const result = await Product.findAndCountAll({
          where: whereConditions, // Apply the dynamically built WHERE conditions.
          limit: calculatedLimit, // Apply the calculated limit for pagination.
          offset: offset,         // Apply the calculated offset for pagination.
          order: orderConditions, // Apply the constructed ORDER conditions for sorting.
          // By default, Sequelize fetches all attributes (*) unless 'attributes' is explicitly specified.
          // This means 'product_id', 'name', 'image_url', 'images', 'price', etc., will be fetched
          // automatically if they exist in your Product model definition and database table schema.
          // If you needed to include associated models (like Category name), you would add an 'include' option here:
           // include: [{ model: db.Category, as: 'category', attributes: ['name'] }]
      });

      // Log success message with the counts returned by findAndCountAll.
      console.log(`Service getAllProducts success. Found ${result.count} total products matching filters, returning ${result.rows.length} for the current page.`);
      // The result object from findAndCountAll is { count: total_count_after_filters, rows: products_for_current_page }.
      // Return this object as expected by the controller.
      return result;

    } catch (error) {
      // Catch any errors that occur during the Sequelize query execution.
      console.error('Erro inesperado no service getAllProducts:', error); // Log the full error object for debugging.
      // Rethrow a generic error. The controller's catch block will handle this
      // and the global error handler in app.js will send a 500 response (with stack trace in dev).
      throw new Error('Erro interno ao buscar produtos.');
    }
  }

  // Get a single product by ID - PUBLIC view (only active products).
  // Use this method for public-facing product detail pages where only active products should be shown.
   async getProductById(product_id) {
    console.log(`Service getProductById (Public) for ID: ${product_id}`); // Log the ID being searched for
    try {
      // Search for the product by primary key AND ensure it is active.
      // Use findOne with a where clause.
      const product = await Product.findOne({
         where: { product_id: product_id, is_active: true },
         // If you need to include associations (like Category name) for the public view, add include here:
         // include: [...]
      });
      console.log(`Service getProductById success. Product found: ${!!product}`); // Log if product was found (true/false)
      return product; // Returns the product instance or null if not found or not active
    } catch (error) {
      console.error(`Erro inesperado no service getProductById para ID ${product_id}:`, error); // Log the full error
      throw new Error('Erro interno ao buscar produto.'); // Throw a generic error
    }
  }

  // Get a single product by ID - ADMIN view (regardless of status).
  // Use this method for admin panels where you need to view/edit any product, even if inactive.
  async getProductByIdAdmin(product_id) {
      console.log(`Service getProductByIdAdmin for ID: ${product_id}`); // Log the ID being searched for
      try {
          // Use findByPk which searches only by primary key and does NOT filter by 'is_active'.
          const product = await Product.findByPk(product_id);
          console.log(`Service getProductByIdAdmin success. Product found: ${!!product}`); // Log if product was found (true/false)
          return product; // Returns the product instance or null if not found (independent of status)
      } catch (error) {
          console.error(`Erro inesperado no service getProductByIdAdmin para ID ${product_id}:`, error); // Log the full error
          throw new Error('Erro interno ao buscar produto (admin).'); // Throw a generic error for admin context
      }
  }


  // Update an existing product record in the database.
  // This method is for admin updates (can update any product by ID).
  async updateProduct(product_id, productData) {
    console.log(`Service updateProduct for ID: ${product_id}. Data:`, productData); // Log update data
    try {
      // Find the product by primary key (findByPk finds regardless of active status, suitable for admin update).
      const product = await Product.findByPk(product_id);

      if (!product) {
        console.warn(`Service updateProduct: Product with ID ${product_id} not found.`); // Log warning if product not found
        return null; // Return null if product was not found for update
      }

      // Update the found product instance with the new data.
      // Sequelize's update method on an instance saves changes to the DB.
      // Sequelize handles mapping fields from productData to model attributes.
      await product.update(productData);

      console.log(`Service updateProduct success for ID: ${product_id}`); // Log successful update

      // Optionally re-fetch the product after updating to ensure all latest attributes are returned.
      // This can be helpful if you have hooks or associations that modify the instance after update.
      const updatedProduct = await Product.findByPk(product_id);
      return updatedProduct; // Return the updated product instance

    } catch (error) {
      // Catch specific Sequelize unique constraint errors during update.
      if (error.name === 'SequelizeUniqueConstraintError' || (error.parent && error.parent.code === '23505')) {
           console.warn(`Service updateProduct: Caught Sequelize Unique Constraint Error for ID ${product_id}`, error.errors); // Log error details
           const field = error.errors[0]?.path || 'campo';
           throw new Error(`Valor duplicado para o campo '${field}'.`); // Throw specific error message
      }
       // Catch Sequelize validation errors during update.
       if (error.name === 'SequelizeValidationError') {
            console.warn('Service updateProduct: Caught Sequelize Validation Error', error); // Log validation errors
            const validationErrors = error.errors.map(err => err.message).join(', ');
            throw new Error(`Erro de validação: ${validationErrors}`);
        }
      console.error(`Erro inesperado no service updateProduct para ID ${product_id}:`, error); // Log the full error
      throw new Error('Erro interno ao atualizar produto.'); // Throw a generic internal error
    }
  }

  // Delete a product record from the database.
  // This method is for admin deletion.
  async deleteProduct(product_id) {
    console.log(`Service deleteProduct for ID: ${product_id}`); // Log ID being deleted
    try {
      // Execute the delete operation based on the product_id using Product.destroy().
      // Note: This method ONLY deletes the DB record. File system cleanup (deleting images)
      // associated with the product should be handled separately, ideally in the controller
      // BEFORE calling this service method (after fetching the product's image URLs).
      const deletedRowCount = await Product.destroy({
        where: { product_id: product_id } // Delete where product_id matches
      });

      console.log(`Service deleteProduct success. Rows deleted: ${deletedRowCount} for ID: ${product_id}`); // Log result (0 or 1)
      return deletedRowCount; // Returns the number of rows deleted (0 if not found, 1 if deleted)

    } catch (error) {
      // Catch any errors during the delete operation.
      console.error(`Erro inesperado no service deleteProduct para ID ${product_id}:`, error); // Log the full error
      throw new Error('Erro interno ao deletar produto.'); // Throw a generic internal error
    }
  }

}

// Export an instance of the ProductService class so controllers can use its methods.
module.exports = new ProductService();