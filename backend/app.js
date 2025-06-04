// app.js
// Express application for “User Accounts & Profile Management”
// Using ES Module syntax

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
    User,
    Category,
    Review,
    Product,
    Cart,
    Order,
    Wishlist,
    PaymentMethod,
    Notification,
    ReportedReview,
} from './orm.js';

import cors from 'cors';
import { upload, uploadToGCP, deleteFromGCP } from './gcp-storage.js';
import { PredictionServiceClient } from '@google-cloud/aiplatform';

dotenv.config();

// Add CORS middleware after dotenv.config()
app.use(cors());
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

app.post('/api/upload/image', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const folder = req.query.folder || 'profiles'; // Default to profiles folder
        const uploadResult = await uploadToGCP(req.file, folder);

        return res.status(200).json({
            message: 'Image uploaded successfully',
            image: {
                url: uploadResult.url,
                gcpStoragePath: uploadResult.gcpStoragePath,
                originalName: uploadResult.originalName,
                mimeType: uploadResult.mimeType,
                size: uploadResult.size,
            },
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ message: 'Failed to upload image' });
    }
});

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
            images, // Now expecting: { url, gcpStoragePath, altText }
        } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user document
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: role && ['buyer', 'seller', 'admin'].includes(role) ? role : 'buyer',
            phone: phone ? phone.trim() : undefined,
            // Only add images if provided, otherwise leave undefined
            images: images && images.url && images.gcpStoragePath ? {
                url: images.url.trim(),
                gcpStoragePath: images.gcpStoragePath.trim(),
                altText: images.altText ? images.altText.trim() : name.trim(),
                isPrimary: true,
            } : undefined,
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
app.put('/api/users/profile/image', protect, upload.single('image'), async (req, res) => {
    try {
        const user = req.user;

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Delete old image if exists
        if (user.images && user.images.gcpStoragePath) {
            await deleteFromGCP(user.images.gcpStoragePath);
        }

        // Upload new image
        const uploadResult = await uploadToGCP(req.file, 'profiles');

        // Update user profile
        user.images = {
            url: uploadResult.url,
            gcpStoragePath: uploadResult.gcpStoragePath,
            altText: req.body.altText || user.name,
            isPrimary: true,
        };

        const updatedUser = await user.save();

        return res.json({
            message: 'Profile image updated successfully',
            images: updatedUser.images,
        });
    } catch (error) {
        console.error('Error updating profile image:', error);
        return res.status(500).json({ message: 'Failed to update profile image' });
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

app.get('/api/search', async (req, res) => {
  try {
    // Extract query parameters
    const pageSize = Number(req.query.limit) || 20;
    const page = Number(req.query.page) || 1;
    const keyword = req.query.keyword ? req.query.keyword.trim() : null;
    const categoryId = req.query.category ? req.query.category.trim() : null;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const minRating = req.query.rating ? Number(req.query.rating) : null;
    const inStock = req.query.inStock === 'true';
    const sortBy = req.query.sortBy || 'newest';
    const order = req.query.order === 'asc' ? 1 : -1;

    // Build filter object
    const filter = {};

    // Keyword filter (search in name OR description, case-insensitive)
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    // Category filter
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.categories = mongoose.Types.ObjectId(categoryId);
    }

    // Price range filter
    if (minPrice !== null || maxPrice !== null) {
      filter.price = {};
      if (minPrice !== null) filter.price.$gte = minPrice;
      if (maxPrice !== null) filter.price.$lte = maxPrice;
    }

    // Rating filter (rating >= minRating)
    if (minRating !== null) {
      filter.rating = { $gte: minRating };
    }

    // In-stock filter (countInStock > 0)
    if (inStock) {
      filter.countInStock = { $gt: 0 };
    }

    // Determine sorting field
    let sortField;
    switch (sortBy) {
      case 'price':
        sortField = 'price';
        break;
      case 'rating':
        sortField = 'rating';
        break;
      case 'newest':
      default:
        sortField = 'createdAt';
        break;
    }

    // Count total matching documents
    const total = await Product.countDocuments(filter);

    // Fetch paginated products
    const products = await Product.find(filter)
      .populate('seller', 'name')
      .populate('categories', 'name slug')
      .sort({ [sortField]: order })
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    return res.json({
      products,
      page,
      pages: Math.ceil(total / pageSize),
      total,
    });
  } catch (err) {
    console.error('Error in GET /api/search:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// ---------------------------------------
// Vertex AI Client Initialization
// ---------------------------------------
// Ensure you have set the following environment variables:
//   VERTEX_PROJECT_ID – your GCP project ID
//   VERTEX_LOCATION   – the region in which your endpoint resides (e.g., "us-central1")
//   VERTEX_ENDPOINT_ID – the ID of your deployed recommendation endpoint
const vertexClient = new PredictionServiceClient();

const getVertexEndpointPath = () => {
  const project = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION;
  const endpoint = process.env.VERTEX_ENDPOINT_ID;
  if (!project || !location || !endpoint) {
    throw new Error(
      'Missing Vertex AI configuration. Please set VERTEX_PROJECT_ID, VERTEX_LOCATION, and VERTEX_ENDPOINT_ID.'
    );
  }
  return `projects/${project}/locations/${location}/endpoints/${endpoint}`;
};

// ---------------------------------------
// Route: GET /api/users/profile/vertex-recommendations
//    - Generate personalized recommendations by calling a Vertex AI endpoint.
//    - Protected: requires valid JWT (protect middleware).
//    - Logic:
//        1. Fetch the user’s past purchased product IDs from Order documents.
//        2. Build a “feature” object (e.g., { userHistory: [<productId1>, <productId2>, …] }).
//        3. Call Vertex AI Predict API with that instance.
//        4. Receive an array of recommended product IDs.
//        5. Lookup those products in MongoDB and return full product details.
//    - Query Params: limit (default: 10)
// ---------------------------------------
app.get('/api/users/profile/vertex-recommendations', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const limit = Number(req.query.limit) || 10;

    // 1. Retrieve the user’s past orders
    const pastOrders = await Order.find({ user: userId }).select('orderItems.product');
    const purchasedProductIds = pastOrders
      .flatMap(order => order.orderItems.map(item => item.product.toString()))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    // 2. Build the instance payload for Vertex AI
    //    Here, we assume the deployed model expects an object with a 'user_history' key,
    //    which is a list of product IDs (strings). Adjust field names/structure if your model differs.
    const instance = {
      user_history: purchasedProductIds,
      // You can include other features here if your model requires them:
      // e.g., user_profile: { age: 30, interests: ['electronics', 'books'] }, etc.
    };

    // 3. Prepare the Predict request
    const endpointPath = getVertexEndpointPath();
    const request = {
      endpoint: endpointPath,
      instances: [instance],
      // parameters can be used to pass additional inference-time options; empty if not needed
      parameters: {},
    };

    // 4. Call Vertex AI predict()
    const [response] = await vertexClient.predict(request);
    if (!response || !Array.isArray(response.predictions) || response.predictions.length === 0) {
      return res.status(200).json({ recommendations: [] });
    }

    // 5. Extract recommended product IDs from the prediction response
    //    We assume response.predictions[0] is something like { recommended_ids: ['id1', 'id2', ...] }
    const prediction = response.predictions[0];
    if (!prediction.recommended_ids || !Array.isArray(prediction.recommended_ids)) {
      return res.status(200).json({ recommendations: [] });
    }

    // Limit the recommendations
    const recommendedIds = prediction.recommended_ids.slice(0, limit);

    // 6. Fetch product details from MongoDB
    const objectIds = recommendedIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => mongoose.Types.ObjectId(id));

    const recommendedProducts = await Product.find({ _id: { $in: objectIds } })
      .populate('seller', 'name')
      .populate('categories', 'name slug');

    // 7. Return recommended products
    return res.json({ recommendations: recommendedProducts });
  } catch (err) {
    console.error('Error in GET /api/users/profile/vertex-recommendations:', err);
    // If Vertex AI fails, you can optionally fall back to a simpler in-app recommendation logic.
    return res.status(500).json({ message: 'Server error in generating recommendations' });
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
