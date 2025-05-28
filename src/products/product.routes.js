// src/routes/product.routes.js
// Defines the API routes for products and applies necessary middleware.

const express = require('express');
const router = express.Router();

// --- Import Dependencies ---
const multer = require('multer'); // Middleware for handling file uploads
const path = require('path');     // Node.js module for working with file paths

// Import the product controller functions
const productController = require('../products/product.controller'); // Assuming controller is here

// Import authentication and authorization middleware
const { authMiddleware, adminCheckMiddleware } = require('../middleware/authMiddleware'); // Assuming middleware is here


// --- MULTER STORAGE CONFIGURATION ---
// Configures how Multer should store uploaded files.
// We use disk storage to save files directly to the server's filesystem.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the target directory for uploads.
    // This path should be relative to the backend's root directory
    // (where app.js is typically located) and MUST match the directory
    // you are creating on startup in app.js and serving statically.
    // __dirname here is typically 'your_project_root/src/routes'.
    // '../../' goes up two levels to 'your_project_root'.
    const uploadPath = path.join(__dirname, '../../uploads', 'product-images');

    // Note: The creation of this directory is handled in app.js startup
    // using fs.mkdirSync({ recursive: true }). So, we don't need to
    // check/create it here in the middleware function.

    // Call the callback with null for error and the destination path.
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Define the filename for the saved file.
    // It's good practice to use a unique name to prevent conflicts.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname); // Get the original file extension (e.g., '.jpg')

    // Construct the final filename.
    // file.fieldname is the name from the form input ('productImageFile').
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// Optional: File filter to restrict allowed file types.
const fileFilter = (req, file, cb) => {
  // Check if the file's MIME type starts with 'image/'.
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept the file by calling the callback with true.
  } else {
    // Reject the file by calling the callback with an Error and false.
    // The Error object's message will be accessible in the error-handling middleware.
     cb(new Error('Tipo de arquivo inválido. Apenas imagens (JPG, JPEG, PNG, GIF) são permitidas.'), false);
  }
};

// Create the Multer instance.
// This instance is used as middleware in your routes.
const upload = multer({
    storage: storage, // Use the disk storage configuration
    fileFilter: fileFilter, // Apply the file type filter
    limits: {
        fileSize: 1024 * 1024 * 5 // Set file size limit (e.g., 5MB)
    }
});
// --- END MULTER CONFIGURATION ---


// --- Product Routes ---

// Public Routes (No authentication or admin checks required)

// GET /api/v1/products - List all products (with optional filters, pagination, sorting)
// This route is used by both EcommerceHomePage (for recent products)
// and AdminProductsPage (for the main list).
// The controller must handle the 'is_active' filter appropriately for public vs. admin view.
router.get('/', productController.getAllProducts);

// GET /api/v1/products/:id - Get a single product by ID
// If this route is used by the PUBLIC side, the controller should use productService.getProductById (active only).
// If this route is used by the ADMIN side (e.g., for editing), the controller should use productService.getProductByIdAdmin (any status).
// Based on our previous discussion and the controller code, the controller for this route
// is using getProductByIdAdmin, suggesting this route is configured for ADMIN use.
router.get('/:id', productController.getProductById); // Calls productController.getProductById


// Protected Admin Routes (Require Authentication and Admin privileges)

// POST /api/v1/products - Create a new product
router.post('/', [authMiddleware, adminCheckMiddleware], productController.createProduct);

// PUT /api/v1/products/:id - Update an existing product
router.put('/:id', [authMiddleware, adminCheckMiddleware], productController.updateProduct);

// DELETE /api/v1/products/:id - Delete a product
router.delete('/:id', [authMiddleware, adminCheckMiddleware], productController.deleteProduct);


// --- Image Upload Route ---

// POST /api/v1/products/upload-image - Handle a single image file upload for a product.
// This route expects a file in a form field named 'productImageFile'.
// Middleware chain:
// 1. authMiddleware: Ensures the user is authenticated.
// 2. adminCheckMiddleware: Ensures the authenticated user has admin privileges.
// 3. upload.single('productImageFile'): Multer middleware processes the file upload.
//    - If successful, the file info is added to req.file, and the request proceeds to the next handler.
//    - If a MulterError occurs (e.g., file size limit, invalid field name), it skips the controller
//      and passes the error directly to the next error-handling middleware in the chain.
// 4. productController.uploadProductImage: This is the controller function called upon successful upload.
// 5. (error, req, res, next) => { ... }: This is a dedicated error-handling middleware
//    specifically for this route. It catches errors that occurred in the preceding middleware
//    (especially Multer errors like file filter or size limits) and sends a 400 response.
router.post('/upload-image',
  [authMiddleware, adminCheckMiddleware, upload.single('productImageFile')], // Middleware array
  productController.uploadProductImage, // Controller function for successful upload
  (error, req, res, next) => { // Specific error handler for this route
    // Check if the caught error is an instance of MulterError.
    if (error instanceof multer.MulterError) {
        let message = 'Erro no upload do arquivo.';
        // Customize error messages based on specific Multer error codes.
        if (error.code === 'LIMIT_FILE_SIZE') {
            message = `Arquivo muito grande. Tamanho máximo permitido é ${upload.limits.fileSize / 1024 / 1024}MB.`; // Use the limit set in Multer config
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
             message = `Campo de arquivo inválido: ${error.field}. Esperado 'productImageFile'.`;
        } else {
             // Log other less common Multer errors for debugging.
             console.error(`Multer Error Code: ${error.code}`, error);
             message = `Erro no upload: ${error.code}`; // Provide the code in the message
        }
        // Send a 400 Bad Request response for client-side upload errors.
        return res.status(400).send({ message });
    } else if (error) {
         // Handle other errors that might have occurred *before* Multer (e.g., auth middleware errors)
         // or errors thrown by the fileFilter function.
         console.error("Erro não-Multer durante upload:", error);
         // Send a 400 response with the error message.
         return res.status(400).send({ message: error.message || 'Ocorreu um erro desconhecido durante o upload.' });
    }
     // If an error occurred but wasn't handled above, pass it to the next error middleware
     // (the global one defined in app.js). This line is mostly a fallback.
    next(error);
  }
);


// Export the router instance to be used in app.js
module.exports = router;