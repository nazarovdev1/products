const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');

// Middleware
app.use(cors());
app.use(express.json());

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public', 'images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat rasm fayllarini yuklang'));
    }
  }
});

// Helper function to read products
async function readProducts() {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products:', error);
    return [];
  }
}

// Helper function to write products
async function writeProducts(products) {
  try {
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing products:', error);
    return false;
  }
}

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET product by code
app.get('/api/products/:code', async (req, res) => {
  try {
    const products = await readProducts();
    const product = products.find(p => p.code === req.params.code);
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST new product (with multer error handling)
app.post('/api/products', (req, res, next) => {
  upload.single('productImage')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Rasm hajmi juda katta. Maksimum 10MB' });
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Bir vaqtning o\'zida faqat bitta rasm yuklash mumkin' });
      }
    } else if (err) {
      return res.status(400).json({ error: 'Rasm yuklashda xatolik: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const products = await readProducts();
    const newProduct = req.body;

    // Add image path if uploaded
    if (req.file) {
      newProduct.image = `/images/${req.file.filename}`;
    }

    // Validate required fields
    if (!newProduct.title || !newProduct.price) {
      return res.status(400).json({ error: 'Missing required fields (title, price)' });
    }

    // Check if code already exists (only if code is provided)
    if (newProduct.code) {
      const existingProduct = products.find(p => p.code === newProduct.code);
      if (existingProduct) {
        return res.status(400).json({ error: 'Product code already exists' });
      }
    }

    // Convert string numbers
    newProduct.price = parseInt(newProduct.price) || 0;
    newProduct.purchase_price = parseInt(newProduct.purchase_price) || 0;
    newProduct.stock = parseInt(newProduct.stock) || 0;
    newProduct.sold_price = parseInt(newProduct.sold_price) || 0;

    // Parse size back to array
    if (typeof newProduct.size === 'string') {
      try {
        // First try to parse as JSON array
        newProduct.size = JSON.parse(newProduct.size);
        // If it's not an array after parsing, handle as comma-separated string
        if (!Array.isArray(newProduct.size)) {
          newProduct.size = newProduct.size.toString().split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
      } catch (e) {
        // If parsing fails, assume it's comma-separated string
        newProduct.size = newProduct.size.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    } else if (!newProduct.size) {
      newProduct.size = [];
    } else if (!Array.isArray(newProduct.size)) {
      // If it's not a string and not an array, convert to array
      newProduct.size = [newProduct.size];
    }

    // Add creation timestamp
    newProduct.creation_date = new Date().toISOString().split('T')[0];

    // Generate unique ID
    newProduct.id = Date.now().toString();

    // Add new product
    products.push(newProduct);

    // Save to file
    const success = await writeProducts(products);

    if (success) {
      res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } else {
      res.status(500).json({ error: 'Failed to save product' });
    }
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// PATCH product update by code
app.patch('/api/products/:code', (req, res, next) => {
  // Use Multer middleware only if there's a file upload
  if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
    upload.single('productImage')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Rasm hajmi juda katta. Maksimum 10MB' });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Bir vaqtning o\'zida faqat bitta rasm yuklash mumkin' });
        }
      } else if (err) {
        return res.status(400).json({ error: 'Rasm yuklashda xatolik: ' + err.message });
      }
      next();
    });
  } else {
    // If not multipart, just continue
    next();
  }
}, async (req, res) => {
  try {
    const products = await readProducts();
    const productCode = req.params.code;

    const productIndex = products.findIndex(p => p.code === productCode);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = req.body;

    // Handle image path if uploaded via multipart
    if (req.file) {
      updatedProduct.image = `/images/${req.file.filename}`;
    }

    // Convert string numbers if they exist
    if (updatedProduct.price) updatedProduct.price = parseInt(updatedProduct.price);
    if (updatedProduct.purchase_price) updatedProduct.purchase_price = parseInt(updatedProduct.purchase_price);
    if (updatedProduct.stock) updatedProduct.stock = parseInt(updatedProduct.stock);
    if (updatedProduct.sold_price) updatedProduct.sold_price = parseInt(updatedProduct.sold_price);

    // Parse size back to array if it's a string
    if (updatedProduct.size !== undefined && updatedProduct.size !== null) {
      if (typeof updatedProduct.size === 'string') {
        try {
          // First try to parse as JSON array
          updatedProduct.size = JSON.parse(updatedProduct.size);
          // If it's not an array after parsing, handle as comma-separated string
          if (!Array.isArray(updatedProduct.size)) {
            updatedProduct.size = updatedProduct.size.toString().split(',').map(s => s.trim()).filter(s => s.length > 0);
          }
        } catch (e) {
          // If parsing fails, assume it's comma-separated string
          updatedProduct.size = updatedProduct.size.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
      } else if (!Array.isArray(updatedProduct.size)) {
        // If it's not a string and not an array, convert to array
        updatedProduct.size = [updatedProduct.size];
      }
    }

    // Update the product
    products[productIndex] = { ...products[productIndex], ...updatedProduct };

    // Save updated products to file
    const success = await writeProducts(products);

    if (success) {
      res.json({ message: 'Mahsulot muvaffaqiyatli yangilandi', product: products[productIndex] });
    } else {
      res.status(500).json({ error: 'Mahsulot yangilanmadi' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Mahsulot yangilanishda xatolik yuz berdi' });
  }
});

// DELETE product by id (legacy route)
app.delete('/api/products/id/:id', async (req, res) => {
  try {
    const products = await readProducts();
    const productId = req.params.id;

    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Remove product from array
    products.splice(productIndex, 1);

    // Save updated products to file
    const success = await writeProducts(products);

    if (success) {
      res.json({ message: 'Mahsulot muvaffaqiyatli o\'chirildi' });
    } else {
      res.status(500).json({ error: 'Mahsulot o\'chirishda xatolik yuz berdi' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Mahsulot o\'chirishda xatolik yuz berdi' });
  }
});

// DELETE product by code
app.delete('/api/products/:code', async (req, res) => {
  try {
    const products = await readProducts();
    const productCode = req.params.code;

    console.log('Attempting to delete product with code:', productCode); // Debug log
    console.log('Available products:', products.map(p => ({ code: p.code, title: p.title }))); // Debug log

    const productIndex = products.findIndex(p => p.code === productCode);
    console.log('Product index found:', productIndex); // Debug log

    if (productIndex === -1) {
      console.log('Product not found for code:', productCode); // Debug log
      return res.status(404).json({ error: 'Product not found' });
    }

    // Remove product from array
    products.splice(productIndex, 1);

    // Save updated products to file
    const success = await writeProducts(products);

    if (success) {
      console.log('Product deleted successfully'); // Debug log
      res.json({ message: 'Mahsulot muvaffaqiyatli o\'chirildi' });
    } else {
      res.status(500).json({ error: 'Mahsulot o\'chirishda xatolik yuz berdi' });
    }
  } catch (error) {
    console.error('Error deleting product:', error); // Debug log
    res.status(500).json({ error: 'Mahsulot o\'chirishda xatolik yuz berdi' });
  }
});

// Search products
app.get('/api/products/search/:query', async (req, res) => {
  try {
    const products = await readProducts();
    const query = req.params.query.toLowerCase();

    const filtered = products.filter(product => {
      return (
        product.title.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.color.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query) ||
        product.status.toLowerCase().includes(query) ||
        product.size.toLowerCase().includes(query)
      );
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Static files and SPA fallback
app.use(express.static('public'));

// Catch-all for API routes to return JSON errors for 404s
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// SPA fallback - only non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
