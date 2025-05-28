// src/controllers/product.controller.js
// This controller handles incoming HTTP requests for products,
// parses query parameters and request bodies, and calls the appropriate
// productService methods.

// Assuming productService is in src/services and has methods that:
// - accept filters, pagination, and sorting for list view (getAllProducts)
// - fetch product by ID (getProductById / getProductByIdAdmin)
// - handle creation, update, deletion (createProduct, updateProduct, deleteProduct)

const productService = require('../products/product.service');
const path = require('path'); // Needed for path manipulation
// const fs = require('fs'); // Uncomment if you add file deletion logic


// --- Helper function to construct the public URL ---
// This must match the express.static mapping in app.js and Multer's save directory
// Example: app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Multer destination: path.join(__dirname, 'uploads', 'product-images');
const getPublicImageUrl = (filename) => {
    // Construct the URL path relative to the static serve path '/uploads'
    // Add the subdirectory used by Multer for organization
    return `/uploads/product-images/${filename}`;
};


// --- Controller Functions ---

// Controller for creating a new product (requires admin authentication)
const createProduct = async (req, res, next) => {
  const productData = req.body;
  console.log('Controller createProduct received body:', productData); // <<< ADDED LOG >>>

  // Basic validation: check for essential fields
  if (!productData.name || !productData.slug || productData.price === undefined || productData.stock === undefined) {
      console.warn('Controller createProduct: Missing required fields.', productData); // <<< ADDED LOG >>>
      return res.status(400).json({ message: 'Campos obrigatórios faltando: nome, slug, preço, estoque.' });
  }

  // Prepare data shape before sending to service (ensure consistency)
  // Sequelize handles 'createdAt' automatically if timestamps: true
  productData.updated_at = new Date(); // Ensure 'updated_at' is set

  // Handle 'is_active' field from frontend (should be boolean)
   if (productData.is_active === undefined) {
        console.warn(`Controller createProduct: is_active missing in body for new product. Defaulting to true.`); // <<< ADDED LOG >>>
        productData.is_active = true; // Default to true if not provided
   }


  productData.specs = productData.specs || {}; // Ensure specs is at least an empty object if not provided

  // Process 'images' field from frontend (should be an array of URLs after upload)
   if (!Array.isArray(productData.images)) {
        console.warn('Controller createProduct: images field is not an array. Trying to use image_url fallback.', productData.images); // <<< ADDED LOG >>>
       // Fallback if frontend doesn't send the array correctly (e.g., sends only image_url string)
       productData.images = productData.image_url ? [productData.image_url] : null; // Set to array with image_url or null
   } else {
       // Filter out any potential empty/null/undefined/non-string values from the array
       productData.images = productData.images.filter(url => url && typeof url === 'string');
        // If the filtered array is empty, store as null in DB (assuming ARRAY type allows null)
        if (productData.images.length === 0) {
            productData.images = null;
        }
   }

    // Ensure 'image_url' (main image) is the first URL in the 'images' array if the array is not null/empty
    // If 'images' is null or empty, 'image_url' should also be null.
    productData.image_url = (productData.images && productData.images.length > 0) ? productData.images[0] : null;


   // Handle 'original_price' field
    if (productData.original_price === undefined || productData.original_price === null || parseFloat(productData.original_price) <= 0) {
       productData.original_price = null; // Store as null if not provided, null, or zero/negative
    } else {
        // Ensure it's stored as a number (Sequelize handles DECIMAL precision)
        productData.original_price = parseFloat(productData.original_price);
        if (isNaN(productData.original_price)) productData.original_price = null; // Handle potential parsing errors
    }
     // Clean up potential camelCase field from older frontend versions if necessary (AdminProductsPage now uses snake_case 'original_price')
     delete productData.originalPrice;


  try {
    // Call service to create the product in the database
    const newProduct = await productService.createProduct(productData);
    console.log('Controller createProduct success, new product:', newProduct); // <<< ADDED LOG >>>
    res.status(201).json(newProduct); // Respond with the created product data

  } catch (error) {
     // Handle known errors from service layer (e.g., unique constraints)
     if (error.message && (error.message.includes('Slug já existe') || error.message.includes('SKU já existe') || error.message.includes('Valor duplicado'))) {
         console.warn('Controller createProduct: Duplicate value error caught.', error.message); // <<< ADDED LOG >>>
         return res.status(409).json({ message: error.message }); // Conflict
     }
      if (error.name === 'SequelizeValidationError') {
           const validationErrors = error.errors.map(err => err.message).join(', ');
            console.warn('Controller createProduct: Sequelize Validation Error caught.', error); // <<< ADDED LOG >>>
            return res.status(400).json({ message: `Erro de validação: ${validationErrors}` }); // Bad Request
       }
      // Log other unexpected errors and pass them to the global error handler in app.js
      console.error('Erro no controller createProduct:', process.env.NODE_ENV === 'development' ? error : error.message); // <<< ADDED LOG >>>
     next(error); // Pass error to the next error handling middleware
  }
};

// Controller for listing and filtering products (used by both public and admin)
// This assumes the service layer correctly handles filters (especially is_active)
// based on the filters object passed from here.
const getAllProducts = async (req, res, next) => {
  console.log('Controller getAllProducts received query:', req.query); // <<< ADDED LOG >>>
  try {
    // Extract and parse query parameters
    const {
      minPrice, maxPrice, categoryIds, subcategoryIds, q,
      sortBy, order,
      page, pageSize,
      is_active // This param is used by AdminProductsPage filter
    } = req.query;

    // Build filters object to pass to service
    const filters = {};
    // --- Filter Parsing Logic ---
    if (minPrice !== undefined) { const parsedMinPrice = parseFloat(minPrice); if (!isNaN(parsedMinPrice)) filters.minPrice = parsedMinPrice; }
    if (maxPrice !== undefined) { const parsedMaxPrice = parseFloat(maxPrice); if (!isNaN(parsedMaxPrice)) filters.maxPrice = parsedMaxPrice; }
    if (categoryIds) { const ids = String(categoryIds).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)); if (ids.length > 0) filters.categoryIds = ids; }
    if (subcategoryIds) { const ids = String(subcategoryIds).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)); if (ids.length > 0) filters.subcategoryIds = ids; }
    if (q) { filters.q = q; }

    // Process 'is_active' filter: ONLY add to filters if the query param is present
    // This allows the service layer to fetch ALL products if is_active param is missing (frontend 'all' filter)
     if (is_active !== undefined) {
         // Convert query string 'true'/'false' to boolean
         const isActiveBool = String(is_active).toLowerCase() === 'true';
         filters.is_active = isActiveBool; // Add boolean filter to filters object
         console.log(`Controller getAllProducts: Applying is_active filter from query: ${filters.is_active}`); // <<< ADDED LOG >>>
     }
    // IMPORTANT: If 'is_active' is undefined in req.query, filters.is_active remains undefined.
    // The service MUST handle filters.is_active === undefined by NOT adding an is_active condition.


    // --- Sorting Logic ---
    let sorter = null;
     if (sortBy) {
         // Validate sort field against allowed DB columns
         const validSortFields = ['name', 'price', 'stock', 'created_at', 'updated_at', 'slug', 'is_active', 'product_id'];
         const field = validSortFields.find(f => f === sortBy);

         if (field) {
             const validOrders = ['asc', 'desc'];
             const orderDirection = validOrders.find(o => o === String(order).toLowerCase());
             sorter = { field: field, order: orderDirection || 'asc' }; // Default order to 'asc' if invalid
         } else {
              console.warn(`Controller getAllProducts: Invalid or disallowed sort field "${sortBy}". Ignoring sort.`); // <<< ADDED LOG >>>
              // sorter remains null
         }
     }

     // Always provide a default sort to the service if no valid sort was specified/provided
     if (!sorter) {
        // Default sort (matches frontend default for AdminProductsPage, and public list)
         sorter = { field: 'created_at', order: 'desc' };
     }

     // Add a secondary sort by product_id for stable pagination order, unless already sorting by ID
     if (sorter.field !== 'product_id') {
          sorter.secondaryField = 'product_id';
          sorter.secondaryOrder = 'asc'; // Consistent secondary sort
     }

     // --- Pagination Logic ---
    // Extract and parse pagination parameters from req.query
     let pagination = { current: 1, pageSize: 10 }; // Default pagination values
     // Use the parsed values from req.query (page and pageSize)
     const parsedPage = parseInt(page, 10);
     const parsedPageSize = parseInt(pageSize, 10);

     if (!isNaN(parsedPage) && parsedPage > 0) pagination.current = parsedPage;
     if (!isNaN(parsedPageSize) && parsedPageSize > 0) pagination.pageSize = parsedPageSize;

     console.log('Controller getAllProducts: Passing to service - Filters:', filters, 'Pagination:', pagination, 'Sorter:', sorter); // <<< ADDED LOG >>>


    // Call the service layer. It MUST accept these 3 arguments and return { rows, count }.
    // THIS IS THE LINE WHERE THE ReferenceError WAS REPORTED IN PREVIOUS BACKEND LOGS.
    // The fix required ensuring the service function signature matches and it handles the parameters.
    const result = await productService.getAllProducts(filters, pagination, sorter);

    // Format the response based on the service's return format ({ rows, count })
    let formattedResponse = {
        data: [], // Array of product objects
        total: 0  // Total count of products matching filters
    };

    // Check if the service returned the expected { rows, count } object from findAndCountAll
    if (result && typeof result === 'object' && Array.isArray(result.rows) && typeof result.count === 'number') {
        formattedResponse.data = result.rows; // The array of products for the current page
        formattedResponse.total = result.count; // The total count of products matching filters
         console.log(`Controller getAllProducts: Service returned ${result.rows.length} rows with total count ${result.count}`); // <<< ADJUSTED LOG >>>
         // Log structure of first item to verify image fields are present and correct
         if (result.rows.length > 0) {
              console.log('Controller getAllProducts: Structure of first product item returned:', {
                  product_id: result.rows[0].product_id,
                  name: result.rows[0].name,
                  image_url: result.rows[0].image_url, // Check if this is present and correct URL format
                  images: result.rows[0].images // Check if this is present and an array of strings
              });
         }

    } else if (Array.isArray(result)) {
        // Fallback handling if service somehow returned only an array (less ideal for pagination)
        formattedResponse.data = result;
        formattedResponse.total = result.length; // Estimate total based on array length
         console.warn(`Controller getAllProducts: Service returned only an array (expected {rows, count}). Total based on array length: ${result.length}`); // <<< ADJUSTED LOG >>>

    } else {
         // Handle unexpected return format from service
         console.error("Controller getAllProducts: Unexpected result format from productService.getAllProducts:", result); // <<< ADJUSTED LOG >>>
         // formattedResponse remains { data: [], total: 0 }, which is a safe default in case of unexpected service output.
    }


    res.status(200).json(formattedResponse); // Send the formatted response object to the frontend
    console.log('Controller getAllProducts: Response sent.'); // <<< ADDED LOG >>>

  } catch (error) {
    // Catch any errors thrown by the service layer.
    // Log the full error object in development for better debugging.
    console.error('Erro no controller getAllProducts:', process.env.NODE_ENV === 'development' ? error : error.message); // <<< ADDED LOG >>>
    // If the error here is still a ReferenceError, it indicates the issue might
    // be propagating from within the service method execution itself, or the
    // service file wasn't correctly updated.
    next(error); // Pass the error to the global error handler in app.js to send a 500 response
  }
};


// Controller for getting a single product by ID.
// This assumes this route is used by the ADMIN panel for editing,
// hence it uses the service method that fetches regardless of status.
// If this route is also PUBLIC, you might need separate logic or a different service method.
const getProductById = async (req, res, next) => {
  const { id } = req.params;
  console.log(`Controller getProductById for ID: ${id}`); // <<< ADDED LOG >>>

  try {
    // For the admin panel, fetch the product by primary key regardless of its active status.
    // Use the specific service method designed for admin fetching.
    const product = await productService.getProductByIdAdmin(id); // <<< USE getProductByIdAdmin service method >>>

    if (!product) {
       // If product is not found by ID (for admin edit), return 404.
       const error = new Error('Produto não encontrado.');
       error.status = 404; // HTTP Status: Not Found
        console.warn(`Controller getProductById: Produto com ID ${id} not found.`); // <<< ADDED LOG >>>
       return next(error); // Pass the 404 error to the next middleware
    }

     // Log the fetched product data (partial view for conciseness)
     console.log('Controller getProductById success, product (partial):', {
         product_id: product.product_id,
         name: product.name,
         image_url: product.image_url, // Verify image fields are fetched from DB
         images: product.images
     });

    res.status(200).json(product); // Respond with the found product data
    console.log(`Controller getProductById: Response sent for ID ${id}.`); // <<< ADDED LOG >>>


  } catch (error) {
    // Catch any errors from the service layer.
    console.error(`Erro no controller getProductById para ID ${id}:`, process.env.NODE_ENV === 'development' ? error : error.message); // <<< ADDED LOG >>>
    next(error); // Pass the error to the global error handler
  }
};


// Controller for updating an existing product (requires admin authentication)
const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const productData = req.body;
  console.log(`Controller updateProduct for ID: ${id}`); // <<< ADDED LOG >>>
  console.log('Controller updateProduct received body:', productData); // <<< ADDED LOG >>>

   productData.updated_at = new Date(); // Ensure 'updated_at' timestamp is updated

   // Handle 'is_active' field from frontend. It should be sent as boolean.
   // If it's missing, log a warning, but ideally frontend always sends it.
   if (productData.is_active === undefined) {
        console.warn(`Controller updateProduct: is_active missing in body for product ${id}.`); // <<< ADDED LOG >>>
        // Option: You might want to fetch the existing product here to keep its current 'is_active' status
        // if the frontend failed to send it.
        // const existingProduct = await productService.getProductByIdAdmin(id); // Use admin service method
        // if (existingProduct) productData.is_active = existingProduct.is_active;
        // else productData.is_active = true; // Fallback default if not found or no existing status
   }


   productData.specs = productData.specs || {}; // Ensure specs is an object


    // Process 'images' field from frontend (should be an array of URLs after upload/edit)
   if (!Array.isArray(productData.images)) {
        console.warn(`Controller updateProduct: images field is not an array for product ${id}. Trying to use image_url as fallback.`, productData.images); // <<< ADDED LOG >>>
       // Fallback if frontend doesn't send the array correctly
       productData.images = productData.image_url ? [productData.image_url] : null; // Set to array with image_url or null
   } else {
       // Filter out any potential empty/null/undefined/non-string values from the array
       productData.images = productData.images.filter(url => url && typeof url === 'string');
        // Ensure the array is null if empty, matching the DB column type if it allows null arrays
        if (productData.images.length === 0) {
            productData.images = null;
        }
   }

    // Ensure 'image_url' (main image) is the first URL in the 'images' array if not null/empty
    productData.image_url = (productData.images && productData.images.length > 0) ? productData.images[0] : null;


    // Handle 'original_price' field. Store as null if not provided, null, or <= 0.
    // Sequelize DECIMAL type handles precision.
    if (productData.original_price === undefined || productData.original_price === null || parseFloat(productData.original_price) <= 0) {
       productData.original_price = null; // Store as null
    } else {
        // Ensure it's parsed as a number before potentially saving
        productData.original_price = parseFloat(productData.original_price);
        if (isNaN(productData.original_price)) productData.original_price = null; // Handle potential parsing errors
    }
     // Clean up potential camelCase field
    delete productData.originalPrice;


  try {
    // Call service to update the product in the DB. Service updateProduct should find by PK.
    const updatedProduct = await productService.updateProduct(id, productData);

    if (!updatedProduct) {
       // If service returns null (product not found for update), return 404.
       const error = new Error('Produto não encontrado.');
       error.status = 404; // HTTP Status: Not Found
        console.warn(`Controller updateProduct: Produto com ID ${id} not found for update.`); // <<< ADDED LOG >>>
       return next(error); // Pass 404 error
    }

     console.log('Controller updateProduct success, updated product:', updatedProduct); // <<< ADDED LOG >>>
    res.status(200).json(updatedProduct); // Respond with the updated product data
    console.log(`Controller updateProduct: Response sent for ID ${id}.`); // <<< ADDED LOG >>>


  } catch (error) {
     // Handle known errors from service layer (e.g., unique constraints)
     if (error.name === 'SequelizeUniqueConstraintError') {
         const field = error.errors[0]?.path || 'campo';
          console.warn(`Controller updateProduct: Duplicate value error caught for field '${field}'.`, error); // <<< ADDED LOG >>>
          return res.status(409).json({ message: `Valor duplicado para o campo '${field}'.` }); // Conflict
     }
      if (error.name === 'SequelizeValidationError') {
           const validationErrors = error.errors.map(err => err.message).join(', ');
            console.warn('Controller updateProduct: Sequelize Validation Error caught.', error); // <<< ADDED LOG >>>
            return res.status(400).json({ message: `Erro de validação: ${validationErrors}` }); // Bad Request
       }
    console.error(`Erro no controller updateProduct para ID ${id}:`, process.env.NODE_ENV === 'development' ? error : error.message); // <<< ADDED LOG >>>
    next(error); // Pass other errors to global error handler
  }
};


// Controller for deleting a product (requires admin authentication)
const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  console.log(`Controller deleteProduct for ID: ${id}`); // <<< ADDED LOG >>>

  try {
      // Optional but Recommended: Fetch the product first to get image URLs for file system deletion
      // This requires the 'fs' and 'path' modules and fetching the product data before calling deleteProduct.
      // const fs = require('fs'); // Make sure fs is imported at the top
      // const path = require('path'); // Make sure path is imported at the top
      // const uploadDir = path.join(__dirname, '../../uploads', 'product-images'); // Matches Multer config

      // Fetch product using the admin service method (by PK, regardless of status)
      // const productToDelete = await productService.getProductByIdAdmin(id); // Use admin service method to fetch by PK

      // Call service to delete the product record from the database.
      const deletedRowCount = await productService.deleteProduct(id); // Assuming service returns number of rows deleted (0 or 1)

      if (deletedRowCount === 0) {
         // If service returns 0, product was not found for deletion.
         const error = new Error('Produto não encontrado.');
         error.status = 404; // HTTP Status: Not Found
          console.warn(`Controller deleteProduct: Produto com ID ${id} not found for deletion.`); // <<< ADDED LOG >>>
         return next(error); // Pass 404 error
      }

      // TODO: Implement deletion of associated image files from the file system here (Optional but recommended)
      // This logic goes here AFTER successfully deleting the DB record.
      // Use the productToDelete data fetched earlier to get the list of image URLs.
      // Ensure the public URL is converted back to a valid file system path.
      // if (productToDelete && productToDelete.images && Array.isArray(productToDelete.images)) {
      //     productToDelete.images.forEach(imageUrl => {
      //         try {
      //             // Convert public URL '/uploads/product-images/filename.jpg' to file system path
      //             const relativeImagePath = imageUrl.replace('/uploads/', ''); // Remove '/uploads/' prefix
      //             const filePath = path.join(__dirname, '../../uploads', relativeImagePath); // Build absolute path
      //             console.log(`Controller deleteProduct: Attempting to delete file: ${filePath}`); // Log attempt
      //             if (fs.existsSync(filePath)) { // Check if file exists
      //                 fs.unlinkSync(filePath); // Delete the file synchronously
      //                 console.log(`Controller deleteProduct: Deleted file: ${filePath}`);
      //             } else {
      //                  console.warn(`Controller deleteProduct: File not found for deletion: ${filePath}`);
      //             }
      //         } catch (fileError) {
      //             console.error(`Controller deleteProduct: Failed to delete file ${imageUrl}:`, fileError);
      //             // Log error but don't stop the request flow
      //         }
      //     });
      // }


      console.log(`Controller deleteProduct: Successfully deleted ${deletedRowCount} row(s) for ID ${id}.`); // <<< ADDED LOG >>>
      res.status(200).json({ message: 'Produto deletado com sucesso.' }); // 200 with message is user-friendly for frontend feedback
      // Alternatively, return 204 No Content if no response body is needed: res.status(204).send();

      console.log(`Controller deleteProduct: Response sent for ID ${id}.`); // <<< ADDED LOG >>>


  } catch (error) {
    console.error(`Erro no controller deleteProduct para ID ${id}:`, process.env.NODE_ENV === 'development' ? error : error.message); // <<< ADDED LOG >>>
    next(error); // Pass error to global error handler
  }
};

// Controller function for handling single image uploads using Multer
// This function is called AFTER Multer middleware successfully processed and saved the file.
const uploadProductImage = async (req, res, next) => {
    // Multer middleware (configured in routes) processed the file and attached info to req.file (because of upload.single).
    console.log("Controller uploadProductImage received file:", req.file); // <<< ADDED LOG >>>

    // Check if a file was successfully processed and attached by Multer.
    if (!req.file) {
        // If req.file is not present, it means Multer did NOT successfully process a file.
        // This could happen if fileFilter rejected it, size limit was exceeded, or no file was sent with the correct field name.
        // The specific Multer error handler in product.routes.js *should* catch these and send a 400,
        // but this is a defensive check here.
        console.warn("Controller uploadProductImage called but req.file is missing. Multer likely rejected the file or no file was sent."); // <<< ADJUSTED LOG >>>
        const error = new Error('Nenhum arquivo de imagem recebido ou o tipo/tamanho é inválido.');
        error.status = 400; // HTTP Status: Bad Request
        // Pass the error to the next middleware. The specific Multer error handler in routes
        // is designed to catch this and send a more refined response if it's a MulterError.
        return next(error);
    }

    // Construct the public URL for the saved file.
    // This URL MUST match how app.js serves static files.
    // app.js serves the directory './uploads' (relative to backend root) under the '/uploads' URL path.
    // Multer is configured in product.routes.js to save files into './uploads/product-images'.
    // Therefore, the correct public URL is the static path + the subdirectory + the filename generated by Multer.
    const publicUrl = getPublicImageUrl(req.file.filename); // <<< CORRECTED URL CONSTRUCTION using helper >>>

    console.log(`Controller uploadProductImage success. File saved at: ${req.file.path}, Public URL: ${publicUrl}`); // <<< ADJUSTED LOG >>>

    // Send back the public URL to the frontend.
    // The frontend's handleImageUpload (in AdminProductsPage.jsx) is designed to expect an object
    // in the response data with a 'url' property, which it then uses to update the form state
    // via Ant Design's Upload component's onSuccess callback.
    res.status(200).json({
        message: 'Upload realizado com sucesso!', // Informative message
        url: publicUrl, // THIS IS THE URL THE FRONTEND NEEDS TO STORE FOR THE PRODUCT
        fileName: req.file.filename, // Optional: include the filename
        // filePath: req.file.path // WARNING: Do NOT expose internal server file paths in production responses.
    });

    // Do not call next() after sending a response.
};


// Export the controller functions
module.exports = {
  createProduct,
  getAllProducts, // Used by both AdminProductsPage and EcommerceHomePage for product listing
  getProductById, // Used for fetching a single product (assuming Admin edit view) - Uses getProductByIdAdmin service
  updateProduct,  // Used for updating product details (Admin)
  deleteProduct,  // Used for deleting products (Admin)
  uploadProductImage, // Used for uploading product images
  // If you have a separate public route for fetching a single product (that only returns active ones),
  // ensure it calls productService.getProductById (the public one).
  // If the /:id route is ONLY for admin, then calling getProductByIdAdmin is correct.
  // If ProductCard needs to fetch product details directly from a public route, make sure that route exists
  // and calls the public getProductById service method.
};