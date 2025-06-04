// app.js
// Express application for “User Accounts & Profile Management”
// Using ES Module syntax

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './orm.js';

dotenv.config();

const app = express();
app.use(express.json());

// ---------------------------------------
// 1. MongoDB Connection
// ---------------------------------------
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecom';
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ---------------------------------------
// 2. JWT Utilities & Auth Middleware
// ---------------------------------------
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'supersecret', {
    expiresIn: '30d',
  });
};

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found, invalid token' });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// ---------------------------------------
// 3. Route: POST /api/users/register
//    - Register a new user (buyer or seller)
// ---------------------------------------
app.post('/api/users/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      images, // Expecting an object: { url, gcpStoragePath, altText, isPrimary }
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !images || !images.url || !images.gcpStoragePath) {
      return res
        .status(400)
        .json({ message: 'Name, email, password, and profile image (url & gcpStoragePath) are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user document, including profile image
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role && ['buyer', 'seller', 'admin'].includes(role) ? role : 'buyer',
      phone: phone ? phone.trim() : undefined,
      images: {
        url: images.url.trim(),
        gcpStoragePath: images.gcpStoragePath.trim(),
        altText: images.altText ? images.altText.trim() : '',
        isPrimary: images.isPrimary === true,
      },
    });

    await user.save();

    // Generate JWT
    const token = generateToken(user._id);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      images: user.images,
      token,
    });
  } catch (err) {
    console.error('Error in /api/users/register:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 4. Route: POST /api/users/login
//    - Authenticate user and return token
// ---------------------------------------
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error('Error in /api/users/login:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 5. Route: GET /api/users/profile
//    - Get current user profile (protected)
// ---------------------------------------
app.get('/api/users/profile', protect, async (req, res) => {
  try {
    const user = req.user; // attached by protect middleware
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      images: user.images,
      addresses: user.addresses || [],
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error('Error in GET /api/users/profile:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// ---------------------------------------
// 6. Route: PUT /api/users/profile
//    - Update current user profile (protected)
//    - Can update name, email, phone, and password
// ---------------------------------------
app.put('/api/users/profile', protect, async (req, res) => {
  try {
    const user = req.user; // from protect middleware
    const { name, email, phone, password, images } = req.body;

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone.trim();

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    // Update profile image if provided
    if (images) {
      if (!images.url || !images.gcpStoragePath) {
        return res
          .status(400)
          .json({ message: 'Profile image updates require both url and gcpStoragePath' });
      }
      user.images = {
        url: images.url.trim(),
        gcpStoragePath: images.gcpStoragePath.trim(),
        altText: images.altText ? images.altText.trim() : user.images.altText,
        isPrimary: images.isPrimary === true,
      };
    }

    const updatedUser = await user.save();

    return res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      images: updatedUser.images,
      addresses: updatedUser.addresses || [],
      isVerified: updatedUser.isVerified,
      updatedAt: updatedUser.updatedAt,
      token: generateToken(updatedUser._id),
    });
  } catch (err) {
    console.error('Error in PUT /api/users/profile:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 7. Address Management Routes (protected)
//    - POST   /api/users/profile/addresses
//         Add a new address
//    - PUT    /api/users/profile/addresses/:idx
//         Update address at index `idx`
//    - DELETE /api/users/profile/addresses/:idx
//         Remove address at index `idx`
//    - PUT    /api/users/profile/addresses/:idx/default
//         Set address at index `idx` as default
// ---------------------------------------

// 7.1 Add a new address
app.post('/api/users/profile/addresses', protect, async (req, res) => {
  try {
    const user = req.user;
    const {
      fullName,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phoneNumber,
      isDefault,
    } = req.body;

    // Validate required fields
    if (!fullName || !addressLine1 || !city || !state || !postalCode || !country || !phoneNumber) {
      return res.status(400).json({ message: 'All address fields are required' });
    }

    const newAddress = {
      fullName: fullName.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : '',
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      phoneNumber: phoneNumber.trim(),
      isDefault: isDefault === true,
    };

    // If new address isDefault, unset previous defaults
    if (newAddress.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(newAddress);
    const updatedUser = await user.save();

    return res.status(201).json({ addresses: updatedUser.addresses });
  } catch (err) {
    console.error('Error in POST /api/users/profile/addresses:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 7.2 Update an existing address by index
app.put('/api/users/profile/addresses/:idx', protect, async (req, res) => {
  try {
    const user = req.user;
    const idx = parseInt(req.params.idx, 10);

    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
      return res.status(400).json({ message: 'Invalid address index' });
    }

    const {
      fullName,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phoneNumber,
      isDefault,
    } = req.body;

    const addr = user.addresses[idx];

    if (fullName) addr.fullName = fullName.trim();
    if (addressLine1) addr.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) addr.addressLine2 = addressLine2.trim();
    if (city) addr.city = city.trim();
    if (state) addr.state = state.trim();
    if (postalCode) addr.postalCode = postalCode.trim();
    if (country) addr.country = country.trim();
    if (phoneNumber) addr.phoneNumber = phoneNumber.trim();

    if (isDefault !== undefined) {
      if (isDefault === true) {
        // Unset previous defaults
        user.addresses.forEach((a) => {
          a.isDefault = false;
        });
        addr.isDefault = true;
      } else {
        addr.isDefault = false;
      }
    }

    const updatedUser = await user.save();
    return res.json({ addresses: updatedUser.addresses });
  } catch (err) {
    console.error('Error in PUT /api/users/profile/addresses/:idx:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 7.3 Delete an address by index
app.delete('/api/users/profile/addresses/:idx', protect, async (req, res) => {
  try {
    const user = req.user;
    const idx = parseInt(req.params.idx, 10);

    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
      return res.status(400).json({ message: 'Invalid address index' });
    }

    const removed = user.addresses.splice(idx, 1);
    // If removed address was default, and there’s at least one address left, set first as default
    if (removed[0].isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    const updatedUser = await user.save();
    return res.json({ addresses: updatedUser.addresses });
  } catch (err) {
    console.error('Error in DELETE /api/users/profile/addresses/:idx:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 7.4 Set an address as default by index
app.put('/api/users/profile/addresses/:idx/default', protect, async (req, res) => {
  try {
    const user = req.user;
    const idx = parseInt(req.params.idx, 10);

    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
      return res.status(400).json({ message: 'Invalid address index' });
    }

    // Unset previous defaults
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });

    // Set this one to default
    user.addresses[idx].isDefault = true;

    const updatedUser = await user.save();
    return res.json({ addresses: updatedUser.addresses });
  } catch (err) {
    console.error('Error in PUT /api/users/profile/addresses/:idx/default:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 8. Route: GET /api/users/:id
//    - (Optional) Admin-only: get any user by ID
// ---------------------------------------
app.get('/api/users/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    console.error('Error in GET /api/users/:id:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 1. Route: POST /api/products
//    - Create a new product (protected; only 'seller' or 'admin')
// ---------------------------------------
app.post('/api/products', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!['seller', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied: Only sellers or admins can add products' });
    }

    const {
      name,
      slug,
      description,
      brand,
      categoryIds, // Array of category ObjectId strings
      price,
      countInStock,
      images,      // Array of image objects: [{ url, gcpStoragePath, altText, isPrimary }, ...]
      variants,    // Array of variant objects (optional)
      features,    // Array of strings (optional)
      specifications, // Array of { key, value } (optional)
      isFeatured,    // Boolean (optional)
      featuredUntil, // Date string (optional)
    } = req.body;

    // Validate required fields
    if (!name || !slug || !description || !price || !countInStock || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message:
          'Required fields: name, slug, description, price, countInStock, and at least one image (with url & gcpStoragePath)',
      });
    }

    // Ensure each image object has url & gcpStoragePath
    for (const img of images) {
      if (!img.url || !img.gcpStoragePath) {
        return res
          .status(400)
          .json({ message: 'Each image must include both url and gcpStoragePath' });
      }
    }

    // Verify categories exist (if provided)
    let categoryDocs = [];
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      categoryDocs = await Category.find({ _id: { $in: categoryIds } });
      if (categoryDocs.length !== categoryIds.length) {
        return res.status(400).json({ message: 'One or more category IDs are invalid' });
      }
    }

    // Build product document
    const product = new Product({
      seller: user._id,
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      description: description.trim(),
      brand: brand ? brand.trim() : '',
      categories: categoryDocs.map((c) => c._id),
      price: Number(price),
      countInStock: Number(countInStock),
      images: images.map((img) => ({
        url: img.url.trim(),
        gcpStoragePath: img.gcpStoragePath.trim(),
        altText: img.altText ? img.altText.trim() : '',
        isPrimary: img.isPrimary === true,
      })),
      variants: Array.isArray(variants) ? variants : [],
      features: Array.isArray(features) ? features : [],
      specifications: Array.isArray(specifications) ? specifications : [],
      isFeatured: isFeatured === true,
      featuredUntil: featuredUntil ? new Date(featuredUntil) : null,
    });

    const createdProduct = await product.save();
    return res.status(201).json(createdProduct);
  } catch (err) {
    console.error('Error in POST /api/products:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 2. Route: GET /api/products
//    - Retrieve list of products with optional filters, search, pagination
//    - Query Params: page, limit, keyword, category
// ---------------------------------------
app.get('/api/products', async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 20;
    const page = Number(req.query.page) || 1;
    const keyword = req.query.keyword
      ? {
          name: { $regex: req.query.keyword.trim(), $options: 'i' },
        }
      : {};
    const categoryFilter = req.query.category
      ? { categories: mongoose.Types.ObjectId(req.query.category) }
      : {};

    // Combine filters
    const filter = { ...keyword, ...categoryFilter };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('seller', 'name email')
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    return res.json({
      products,
      page,
      pages: Math.ceil(total / pageSize),
      total,
    });
  } catch (err) {
    console.error('Error in GET /api/products:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 3. Route: GET /api/products/:id
//    - Retrieve a single product by its ID
// ---------------------------------------
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('categories', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(product);
  } catch (err) {
    console.error('Error in GET /api/products/:id:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 4. Route: PUT /api/products/:id
//    - Update an existing product (protected; only original seller or admin)
// ---------------------------------------
app.put('/api/products/:id', protect, async (req, res) => {
  try {
    const user = req.user;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Only seller who created the product or admin can update
    if (product.seller.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Not authorized to update this product' });
    }

    const {
      name,
      slug,
      description,
      brand,
      categoryIds,
      price,
      countInStock,
      images,
      variants,
      features,
      specifications,
      isFeatured,
      featuredUntil,
    } = req.body;

    if (name) product.name = name.trim();
    if (slug) product.slug = slug.toLowerCase().trim();
    if (description) product.description = description.trim();
    if (brand !== undefined) product.brand = brand.trim();

    if (Array.isArray(categoryIds)) {
      const categoryDocs = await Category.find({ _id: { $in: categoryIds } });
      if (categoryDocs.length !== categoryIds.length) {
        return res.status(400).json({ message: 'One or more category IDs are invalid' });
      }
      product.categories = categoryDocs.map((c) => c._id);
    }

    if (price !== undefined) product.price = Number(price);
    if (countInStock !== undefined) product.countInStock = Number(countInStock);

    if (Array.isArray(images)) {
      for (const img of images) {
        if (!img.url || !img.gcpStoragePath) {
          return res
            .status(400)
            .json({ message: 'Each image must include both url and gcpStoragePath' });
        }
      }
      product.images = images.map((img) => ({
        url: img.url.trim(),
        gcpStoragePath: img.gcpStoragePath.trim(),
        altText: img.altText ? img.altText.trim() : '',
        isPrimary: img.isPrimary === true,
      }));
    }

    if (Array.isArray(variants)) product.variants = variants;
    if (Array.isArray(features)) product.features = features;
    if (Array.isArray(specifications)) product.specifications = specifications;
    if (isFeatured !== undefined) product.isFeatured = isFeatured === true;
    if (featuredUntil !== undefined) product.featuredUntil = featuredUntil ? new Date(featuredUntil) : null;

    const updatedProduct = await product.save();
    return res.json(updatedProduct);
  } catch (err) {
    console.error('Error in PUT /api/products/:id:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 5. Route: DELETE /api/products/:id
//    - Delete a product (protected; only original seller or admin)
// ---------------------------------------
app.delete('/api/products/:id', protect, async (req, res) => {
  try {
    const user = req.user;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Only seller who created the product or admin can delete
    if (product.seller.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Not authorized to delete this product' });
    }

    await product.remove();
    return res.json({ message: 'Product removed' });
  } catch (err) {
    console.error('Error in DELETE /api/products/:id:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// ---------------------------------------
// 9. Error Handling for Unmatched Routes & General Errors
// ---------------------------------------
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).json({ message: 'Server error' });
});

// ---------------------------------------
// 10. Start Server
// ---------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
