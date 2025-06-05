// app.js
// Express application for "User Accounts & Profile Management"
// Using ES Module syntax

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();

// Load environment variables FIRST
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'GCP_PROJECT_ID',
    'GCP_STORAGE_BUCKET_NAME',
    'GOOGLE_APPLICATION_CREDENTIALS'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// Import GCP storage after env validation
let upload, uploadToGCP, deleteFromGCP;
try {
    const gcpStorage = await import('./gcp-storage.js');
    upload = gcpStorage.upload;
    uploadToGCP = gcpStorage.uploadToGCP;
    deleteFromGCP = gcpStorage.deleteFromGCP;
    console.log('✅ GCP Storage module loaded successfully');
} catch (error) {
    console.error('❌ Failed to load GCP Storage module:', error.message);
    process.exit(1);
}

// Import ORM models
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
    SavedSearch,
    PriceAlert,
    ChatMessage,
    Ticket,
    Auction
} from './orm.js';

import { PredictionServiceClient } from '@google-cloud/aiplatform';

// Add CORS middleware
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

// Add this route to backend/app.js after the existing user routes:

// ---------------------------------------
// Enhanced Profile Update Route
// ---------------------------------------
app.put('/api/users/profile', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email, phone, bio, location, currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is being changed and if it's already taken
        if (email !== user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
            if (existingUser && existingUser._id.toString() !== userId.toString()) {
                return res.status(400).json({ message: 'Email already in use by another account' });
            }
        }

        // Handle password change if requested
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to set new password' });
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            // Hash new password
            const saltRounds = 12;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
            user.passwordHash = hashedNewPassword;
        }

        // Update user fields
        user.name = name.trim();
        user.email = email.toLowerCase().trim();
        user.phone = phone ? phone.trim() : user.phone;
        user.bio = bio ? bio.trim() : user.bio;
        user.location = location ? location.trim() : user.location;

        // Save updated user
        const updatedUser = await user.save();

        // Return updated user (without password)
        const userResponse = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            bio: updatedUser.bio,
            location: updatedUser.location,
            role: updatedUser.role,
            images: updatedUser.images,
            isVerified: updatedUser.isVerified,
            rating: updatedUser.rating,
            numRatings: updatedUser.numRatings,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };

        return res.json({
            message: 'Profile updated successfully',
            user: userResponse
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ message: 'Server error while updating profile' });
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
// ...existing code...

// Enhanced GET /api/products route
app.get('/api/products', async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;
        
        // Enhanced search - search in name, description, and brand
        const keyword = req.query.keyword
            ? {
                $or: [
                    { name: { $regex: req.query.keyword.trim(), $options: 'i' } },
                    { description: { $regex: req.query.keyword.trim(), $options: 'i' } },
                    { brand: { $regex: req.query.keyword.trim(), $options: 'i' } }
                ]
            }
            : {};

        // Category filter
        const categoryFilter = req.query.category
            ? { categories: mongoose.Types.ObjectId(req.query.category) }
            : {};

        // Price range filter
        const priceFilter = {};
        if (req.query.minPrice) priceFilter.price = { $gte: Number(req.query.minPrice) };
        if (req.query.maxPrice) {
            if (priceFilter.price) {
                priceFilter.price.$lte = Number(req.query.maxPrice);
            } else {
                priceFilter.price = { $lte: Number(req.query.maxPrice) };
            }
        }

        // Stock filter
        const stockFilter = req.query.inStock === 'true' ? { countInStock: { $gt: 0 } } : {};

        // Rating filter
        const ratingFilter = req.query.minRating ? { rating: { $gte: Number(req.query.minRating) } } : {};

        // Combine all filters
        const filter = { 
            ...keyword, 
            ...categoryFilter, 
            ...priceFilter, 
            ...stockFilter, 
            ...ratingFilter 
        };

        // Sort options
        let sortOption = { createdAt: -1 }; // default: newest first
        if (req.query.sort === 'price_low') sortOption = { price: 1 };
        if (req.query.sort === 'price_high') sortOption = { price: -1 };
        if (req.query.sort === 'rating') sortOption = { rating: -1 };
        if (req.query.sort === 'popular') sortOption = { numReviews: -1 };

        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .populate('seller', 'name email images')
            .populate('categories', 'name slug')
            .sort(sortOption)
            .skip(pageSize * (page - 1))
            .limit(pageSize);

        return res.json({
            products,
            page,
            pages: Math.ceil(total / pageSize),
            total,
            filters: {
                keyword: req.query.keyword,
                category: req.query.category,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice,
                inStock: req.query.inStock,
                minRating: req.query.minRating,
                sort: req.query.sort
            }
        });
    } catch (err) {
        console.error('Error in GET /api/products:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});


// Replace the existing /api/products/my-listings route with this enhanced version:

// Get user's listings (both products and auctions)
app.get('/api/products/my-listings', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get regular products
        const products = await Product.find({ seller: userId })
            .populate('seller', 'name email images')
            .populate('categories', 'name slug')
            .sort({ createdAt: -1 });

        // Get auctions
        const auctions = await Auction.find({ seller: userId })
            .populate('seller', 'name email images')
            .sort({ createdAt: -1 });

        // Format products for consistent response
        const formattedProducts = products.map(product => ({
            ...product.toObject(),
            type: 'product',
            listingId: product._id,
            status: product.countInStock > 0 ? 'active' : 'out_of_stock'
        }));

        // Format auctions for consistent response
        const formattedAuctions = auctions.map(auction => {
            const now = new Date();
            let auctionStatus = auction.status;
            
            // Update status based on current time
            if (auction.status === 'upcoming' && now >= auction.startTime) {
                auctionStatus = 'live';
            } else if (auction.status === 'live' && now >= auction.endTime) {
                auctionStatus = 'ended';
            }

            return {
                ...auction.toObject(),
                type: 'auction',
                listingId: auction._id,
                name: auction.title,
                price: auction.currentPrice,
                status: auctionStatus,
                timeRemaining: auctionStatus === 'live' ? Math.max(0, auction.endTime - now) : 0,
                bidCount: auction.bids.length,
                highestBid: auction.currentPrice,
                isReserveMet: auction.reservePrice ? auction.currentPrice >= auction.reservePrice : true
            };
        });

        // Combine and sort by creation date
        const allListings = [...formattedProducts, ...formattedAuctions]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.json({
            listings: allListings,
            total: allListings.length,
            products: formattedProducts.length,
            auctions: formattedAuctions.length
        });
    } catch (error) {
        console.error('Error fetching user listings:', error);
        return res.status(500).json({ message: 'Failed to fetch listings' });
    }
});
// Delete product
app.delete('/api/products/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user owns this product or is admin
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete images from GCP if they exist
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.gcpStoragePath) {
          await deleteFromGCP(image.gcpStoragePath);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Failed to delete product' });
  }
});

// ---------------------------------------
// 3. Route: GET /api/products/:id
//    - Retrieve a single product by its ID
// ---------------------------------------
app.get('/api/products/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await Product.findById(req.params.id)
            .populate('seller', 'name email images rating location createdAt')
            .populate('categories', 'name slug');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Calculate seller rating if not present
        if (!product.seller.rating) {
            // You can implement seller rating calculation here
            // For now, we'll add a placeholder
            product.seller.rating = 4.5; // Default rating
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
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user owns this product or is admin
        if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        }

        // Delete images from GCP if they exist
        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                if (image.gcpStoragePath) {
                    await deleteFromGCP(image.gcpStoragePath);
                }
            }
        }

        await Product.findByIdAndDelete(req.params.id);

        return res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ message: 'Failed to delete product' });
    }
});


const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------------------------------------
// 1. POST /api/auctions
//    - Create a new auction listing (protected; only seller or admin)
//    - Body: {
//        productId: string,
//        startPrice: number,
//        startTime: ISODate string,
//        endTime: ISODate string
//      }
// ---------------------------------------
app.post('/api/auctions', protect, async (req, res) => {
    try {
        const user = req.user;
        if (!['seller', 'admin'].includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Only sellers and admins can create auctions.' });
        }

        const {
            title,
            description,
            startPrice,
            reservePrice,
            startTime,
            endTime,
            category,
            condition,
            images
        } = req.body;

        // Validate required fields
        if (!title || !description || !startPrice || !endTime || !category || !condition) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ message: 'At least one image is required' });
        }

        const priceNum = Number(startPrice);
        if (isNaN(priceNum) || priceNum < 0) {
            return res.status(400).json({ message: 'Starting price must be a valid positive number' });
        }

        const start = startTime ? new Date(startTime) : new Date();
        const end = new Date(endTime);
        
        if (!(end instanceof Date) || isNaN(end)) {
            return res.status(400).json({ message: 'End time must be a valid date' });
        }
        
        if (end <= start) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }

        // Create Auction
        const auction = new Auction({
            title: title.trim(),
            description: description.trim(),
            startPrice: priceNum,
            currentPrice: priceNum,
            reservePrice: reservePrice ? Number(reservePrice) : undefined,
            startTime: start,
            endTime: end,
            category: category.trim(),
            condition: condition,
            images: images.map((img, index) => ({
                url: img.url.trim(),
                gcpStoragePath: img.gcpStoragePath.trim(),
                altText: img.altText || title.trim(),
                isPrimary: index === 0
            })),
            seller: user._id,
            bids: [],
            status: start > new Date() ? 'upcoming' : 'live',
        });

        const created = await auction.save();
        await created.populate('seller', 'name email images');
        
        return res.status(201).json(created);
    } catch (err) {
        console.error('Error in POST /api/auctions:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 2. GET /api/auctions
//    - List all auctions (public)
//    - Optional query params: status (upcoming/live/ended), page, limit
// ---------------------------------------
app.get('/api/auctions', async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 20;
    const page = Number(req.query.page) || 1;
    const statusFilter = req.query.status;

    const filter = {};
    if (
      statusFilter &&
      ['upcoming', 'live', 'ended', 'cancelled'].includes(statusFilter)
    ) {
      filter.status = statusFilter;
    }

    // Count & fetch paginated
    const total = await Auction.countDocuments(filter);
    const auctions = await Auction.find(filter)
      .populate('product', 'name slug images')
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .lean();

    return res.json({
      auctions,
      page,
      pages: Math.ceil(total / pageSize),
      total,
    });
  } catch (err) {
    console.error('Error in GET /api/auctions:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// 3. GET /api/auctions/:id
//    - Get details of a specific auction (public)
// ---------------------------------------
app.get('/api/auctions/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid auction ID' });
        }

        const auction = await Auction.findById(req.params.id)
            .populate('seller', 'name email images rating location createdAt')
            .populate('bids.bidder', 'name')
            .lean();

        if (!auction) {
            return res.status(404).json({ message: 'Auction not found' });
        }

        // Update auction status based on current time
        const now = new Date();
        let currentStatus = auction.status;
        
        if (auction.status === 'upcoming' && now >= auction.startTime) {
            currentStatus = 'live';
            await Auction.findByIdAndUpdate(req.params.id, { status: 'live' });
        } else if (auction.status === 'live' && now >= auction.endTime) {
            currentStatus = 'ended';
            await Auction.findByIdAndUpdate(req.params.id, { status: 'ended' });
        }

        // Add calculated fields
        auction.status = currentStatus;
        auction.timeRemaining = currentStatus === 'live' ? Math.max(0, auction.endTime - now) : 0;
        auction.bidCount = auction.bids.length;

        return res.json(auction);
    } catch (err) {
        console.error('Error in GET /api/auctions/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 4. Route: POST /api/auctions/:id/bid
//    - Place a bid on an auction (protected)
//    - Body: { amount: number }
// ---------------------------------------
app.post('/api/auctions/:id/bid', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    if (auction.status !== 'live') {
      return res.status(400).json({ message: 'Cannot bid on a non-live auction' });
    }

    const now = new Date();
    if (now < auction.startTime) {
      return res.status(400).json({ message: 'Auction has not started yet' });
    }
    if (now > auction.endTime) {
      return res.status(400).json({ message: 'Auction has already ended' });
    }

    const bidAmount = Number(req.body.amount); // Make sure this matches frontend
    if (isNaN(bidAmount) || bidAmount <= auction.currentPrice) { // Changed from currentBid
      return res
        .status(400)
        .json({ message: `Bid must exceed current price (${auction.currentPrice})` });
    }

    // Add new bid
    auction.bids.push({
      bidder: userId,
      amount: bidAmount,
      timestamp: now,
    });
    auction.currentPrice = bidAmount; // Changed from currentBid

    // If this is the first bid, set the auction status to live
    if (auction.status === 'upcoming') {
      auction.status = 'live';
      auction.startTime = now; // Adjust start time to now
    }

    await auction.save();

    return res.status(201).json({
      message: 'Bid placed successfully',
      auction,
    });
  } catch (err) {
    console.error('Error in POST /api/auctions/:id/bid:', err);
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


// -----------------------------------------------------------------------------
// 2. Routes: Saved Searches
// -----------------------------------------------------------------------------

// 2.1 Create a new saved search
//    POST /api/saved-searches
//    Body: { keyword: String (optional), filters: { category, minPrice, maxPrice, minRating, inStock } }
//    Protected: user must be authenticated
app.post('/api/saved-searches', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { keyword, filters } = req.body;

        // At least keyword or one filter should be provided
        if (
            (!keyword || keyword.trim() === '') &&
            (!filters ||
                (filters.category === undefined &&
                    filters.minPrice === undefined &&
                    filters.maxPrice === undefined &&
                    filters.minRating === undefined &&
                    filters.inStock === undefined))
        ) {
            return res
                .status(400)
                .json({ message: 'Provide at least a keyword or one filter to save a search' });
        }

        // Validate category ID if provided
        let categoryObjId = null;
        if (filters && filters.category) {
            if (!mongoose.Types.ObjectId.isValid(filters.category)) {
                return res.status(400).json({ message: 'Invalid category ID in filters' });
            }
            categoryObjId = mongoose.Types.ObjectId(filters.category);
        }

        // Build filters object
        const savedFilters = {};
        if (categoryObjId) savedFilters.category = categoryObjId;
        if (filters.minPrice !== undefined) savedFilters.minPrice = Number(filters.minPrice);
        if (filters.maxPrice !== undefined) savedFilters.maxPrice = Number(filters.maxPrice);
        if (filters.minRating !== undefined) savedFilters.minRating = Number(filters.minRating);
        if (filters.inStock !== undefined) savedFilters.inStock = Boolean(filters.inStock);

        const newSavedSearch = new SavedSearch({
            user: userId,
            keyword: keyword ? keyword.trim() : undefined,
            filters: savedFilters,
        });

        const created = await newSavedSearch.save();
        return res.status(201).json(created);
    } catch (err) {
        console.error('Error in POST /api/saved-searches:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 2.2 Get all saved searches for the current user
//    GET /api/saved-searches
//    Protected
app.get('/api/saved-searches', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const searches = await SavedSearch.find({ user: userId }).sort({ createdAt: -1 });
        return res.json(searches);
    } catch (err) {
        console.error('Error in GET /api/saved-searches:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 2.3 Delete a saved search
//    DELETE /api/saved-searches/:id
//    Protected
app.delete('/api/saved-searches/:id', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const searchId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(searchId)) {
            return res.status(400).json({ message: 'Invalid saved search ID' });
        }

        const search = await SavedSearch.findById(searchId);
        if (!search) {
            return res.status(404).json({ message: 'Saved search not found' });
        }
        if (search.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this saved search' });
        }

        await search.remove();
        return res.json({ message: 'Saved search deleted successfully' });
    } catch (err) {
        console.error('Error in DELETE /api/saved-searches/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// -----------------------------------------------------------------------------
// 3. Routes: Price Alerts
// -----------------------------------------------------------------------------

// 3.1 Create a new price alert
//    POST /api/price-alerts
//    Body: { product: productId (required), targetPrice (required) }
//    Protected
app.post('/api/price-alerts', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { product, targetPrice } = req.body;

        if (!product || !mongoose.Types.ObjectId.isValid(product)) {
            return res.status(400).json({ message: 'Valid product ID is required' });
        }
        if (targetPrice === undefined || isNaN(Number(targetPrice)) || Number(targetPrice) < 0) {
            return res.status(400).json({ message: 'Valid target price is required' });
        }

        // Ensure product exists
        const productExists = await Product.findById(product);
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Prevent duplicate alerts for the same product & user
        const existing = await PriceAlert.findOne({
            user: userId,
            product: mongoose.Types.ObjectId(product),
            isActive: true,
        });
        if (existing) {
            return res
                .status(400)
                .json({ message: 'An active price alert for this product already exists' });
        }

        const newAlert = new PriceAlert({
            user: userId,
            product: mongoose.Types.ObjectId(product),
            targetPrice: Number(targetPrice),
            isActive: true,
        });

        const created = await newAlert.save();
        return res.status(201).json(created);
    } catch (err) {
        console.error('Error in POST /api/price-alerts:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 3.2 Get all price alerts for the current user
//    GET /api/price-alerts
//    Protected
app.get('/api/price-alerts', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const alerts = await PriceAlert.find({ user: userId })
            .populate('product', 'name price images')
            .sort({ createdAt: -1 });
        return res.json(alerts);
    } catch (err) {
        console.error('Error in GET /api/price-alerts:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 3.3 Update a price alert (e.g., change targetPrice or toggle isActive)
//    PUT /api/price-alerts/:id
//    Body: { targetPrice (optional), isActive (optional) }
//    Protected
app.put('/api/price-alerts/:id', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const alertId = req.params.id;
        const { targetPrice, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(alertId)) {
            return res.status(400).json({ message: 'Invalid price alert ID' });
        }

        const alert = await PriceAlert.findById(alertId);
        if (!alert) {
            return res.status(404).json({ message: 'Price alert not found' });
        }
        if (alert.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this price alert' });
        }

        if (targetPrice !== undefined) {
            if (isNaN(Number(targetPrice)) || Number(targetPrice) < 0) {
                return res.status(400).json({ message: 'Valid target price is required' });
            }
            alert.targetPrice = Number(targetPrice);
        }
        if (isActive !== undefined) {
            alert.isActive = Boolean(isActive);
        }

        const updated = await alert.save();
        return res.json(updated);
    } catch (err) {
        console.error('Error in PUT /api/price-alerts/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 3.4 Delete a price alert
//    DELETE /api/price-alerts/:id
//    Protected
app.delete('/api/price-alerts/:id', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const alertId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(alertId)) {
            return res.status(400).json({ message: 'Invalid price alert ID' });
        }

        const alert = await PriceAlert.findById(alertId);
        if (!alert) {
            return res.status(404).json({ message: 'Price alert not found' });
        }
        if (alert.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this price alert' });
        }

        await alert.remove();
        return res.json({ message: 'Price alert deleted successfully' });
    } catch (err) {
        console.error('Error in DELETE /api/price-alerts/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 1. Route: GET /api/cart
//    - Retrieve current user's cart (protected)
// ---------------------------------------
app.get('/api/cart', protect, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price images countInStock seller')
            .populate('items.product.seller', 'name');

        if (!cart) {
            return res.json({ items: [], totalItems: 0, totalPrice: 0 });
        }

        // Calculate totals
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.items.reduce((sum, item) => 
            sum + (item.product.price * item.quantity), 0
        );

        return res.json({
            ...cart.toObject(),
            totalItems,
            totalPrice
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        return res.status(500).json({ message: 'Failed to fetch cart' });
    }
});

app.post('/api/cart', protect, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        // Check if product exists and is in stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.countInStock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Check if item already in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > product.countInStock) {
                return res.status(400).json({ message: 'Not enough stock available' });
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity: quantity,
                priceAtAddition: product.price
            });
        }

        cart.updatedAt = new Date();
        await cart.save();

        // Populate and return updated cart
        await cart.populate('items.product', 'name price images countInStock');
        
        return res.json({ message: 'Item added to cart', cart });
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ message: 'Failed to add to cart' });
    }
});

// ---------------------------------------
// 3. Route: PUT /api/cart
//    - Update quantity of an existing cart item (protected)
//    - Body: { productId: string, quantity: number }
// ---------------------------------------
app.put('/api/cart', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, quantity } = req.body;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Valid productId is required' });
        }
        const qty = Number(quantity);
        if (qty < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        // Fetch product to check stock
        const product = await Product.findById(productId).select('countInStock');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.countInStock < qty) {
            return res.status(400).json({ message: 'Requested quantity exceeds stock' });
        }

        // Find cart
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex((item) =>
            item.product.equals(productId)
        );
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        // Update quantity
        cart.items[itemIndex].quantity = qty;
        cart.updatedAt = Date.now();
        const updatedCart = await cart.save();

        // Populate for response
        const populatedCart = await Cart.findById(updatedCart._id).populate({
            path: 'items.product',
            select: 'name price images countInStock',
        });

        return res.json(populatedCart);
    } catch (err) {
        console.error('Error in PUT /api/cart:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 4. Route: DELETE /api/cart/:productId
//    - Remove a single product from cart (protected)
// ---------------------------------------
app.delete('/api/cart/:productId', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid productId' });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex((item) =>
            item.product.equals(productId)
        );
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        // Remove item
        cart.items.splice(itemIndex, 1);
        cart.updatedAt = Date.now();
        const updatedCart = await cart.save();

        // Populate for response
        const populatedCart = await Cart.findById(updatedCart._id).populate({
            path: 'items.product',
            select: 'name price images countInStock',
        });

        return res.json(populatedCart);
    } catch (err) {
        console.error('Error in DELETE /api/cart/:productId:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 5. Route: DELETE /api/cart
//    - Clear entire cart (protected)
// ---------------------------------------
app.delete('/api/cart', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = [];
        cart.updatedAt = Date.now();
        await cart.save();

        return res.json({ message: 'Cart cleared' });
    } catch (err) {
        console.error('Error in DELETE /api/cart:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 1. Route: GET /api/orders/myorders
//    - Retrieve all past orders for the authenticated user
//    - Optional query params: page, limit
// ---------------------------------------
app.get('/api/orders/myorders', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;

        // Count total orders for pagination
        const total = await Order.countDocuments({ user: userId });

        // Fetch orders sorted by most recent
        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(pageSize * (page - 1))
            .limit(pageSize)
            .select('orderItems totalPrice isPaid paidAt isDelivered deliveredAt createdAt');

        return res.json({
            orders,
            page,
            pages: Math.ceil(total / pageSize),
            total,
        });
    } catch (err) {
        console.error('Error in GET /api/orders/myorders:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/orders/my-orders', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status;

        // Build filter
        const filter = { user: userId };
        if (status) {
            filter.status = status;
        }

        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('orderItems.product', 'name images price seller categories')
            .populate('seller', 'name email images rating location')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Generate order numbers if missing
        const ordersWithNumbers = orders.map(order => ({
            ...order.toObject(),
            orderNumber: order.orderNumber || `ECO${order._id.toString().slice(-8).toUpperCase()}`
        }));

        return res.json({
            orders: ordersWithNumbers,
            page,
            pages: Math.ceil(total / limit),
            total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// Get single order details with full information
app.get('/api/orders/:orderId', protect, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findOne({ 
            _id: orderId, 
            $or: [{ user: userId }, { seller: userId }] 
        })
        .populate('orderItems.product', 'name images price seller categories description')
        .populate('user', 'name email images phone')
        .populate('seller', 'name email images phone rating location')
        .populate('shippingAddress');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Add order number if missing
        const orderResponse = {
            ...order.toObject(),
            orderNumber: order.orderNumber || `ECO${order._id.toString().slice(-8).toUpperCase()}`
        };

        return res.json(orderResponse);
    } catch (error) {
        console.error('Error fetching order:', error);
        return res.status(500).json({ message: 'Failed to fetch order details' });
    }
});

// Enhanced review creation with order verification
app.post('/api/products/:id/reviews', protect, async (req, res) => {
    try {
        const productId = req.params.id;
        const { rating, comment, orderId } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Verify user purchased this product (if orderId provided)
        if (orderId) {
            const order = await Order.findOne({
                _id: orderId,
                user: userId,
                'orderItems.product': productId,
                status: 'delivered'
            });

            if (!order) {
                return res.status(400).json({ 
                    message: 'You can only review products you have purchased and received' 
                });
            }
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // Create review
        const review = new Review({
            user: userId,
            product: productId,
            rating: Number(rating),
            comment: comment ? comment.trim() : '',
            orderId: orderId || null
        });

        await review.save();

        // Update product rating and review count
        const reviews = await Review.find({ product: productId });
        const numReviews = reviews.length;
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / numReviews;

        await Product.findByIdAndUpdate(productId, {
            rating: avgRating,
            numReviews: numReviews
        });

        // Populate review for response
        await review.populate('user', 'name images');

        return res.status(201).json({
            message: 'Review added successfully',
            review
        });
    } catch (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({ message: 'Failed to add review' });
    }
});

// Get reviews for a product with pagination
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const productId = req.params.id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const total = await Review.countDocuments({ product: productId });
        const reviews = await Review.find({ product: productId })
            .populate('user', 'name images')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Calculate rating distribution
        const ratingCounts = await Review.aggregate([
            { $match: { product: mongoose.Types.ObjectId(productId) } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        const ratingDistribution = {};
        [5, 4, 3, 2, 1].forEach(rating => {
            const found = ratingCounts.find(r => r._id === rating);
            ratingDistribution[rating] = found ? found.count : 0;
        });

        return res.json({
            reviews,
            page,
            pages: Math.ceil(total / limit),
            total,
            ratingDistribution
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ message: 'Failed to fetch reviews' });
    }
});

// Add these routes to backend/app.js after existing order routes:

// ---------------------------------------
// Enhanced Orders Routes
// ---------------------------------------

// Get user's orders/purchases with enhanced details
app.get('/api/orders/my-orders', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status;

        // Build filter
        const filter = { user: userId };
        if (status) {
            filter.status = status;
        }

        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('orderItems.product', 'name images price seller categories')
            .populate('seller', 'name email images rating location')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Generate order numbers if missing
        const ordersWithNumbers = orders.map(order => ({
            ...order.toObject(),
            orderNumber: order.orderNumber || `ECO${order._id.toString().slice(-8).toUpperCase()}`
        }));

        return res.json({
            orders: ordersWithNumbers,
            page,
            pages: Math.ceil(total / limit),
            total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// Get single order details with full information
app.get('/api/orders/:orderId', protect, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findOne({ 
            _id: orderId, 
            $or: [{ user: userId }, { seller: userId }] 
        })
        .populate('orderItems.product', 'name images price seller categories description')
        .populate('user', 'name email images phone')
        .populate('seller', 'name email images phone rating location')
        .populate('shippingAddress');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Add order number if missing
        const orderResponse = {
            ...order.toObject(),
            orderNumber: order.orderNumber || `ECO${order._id.toString().slice
        const userId = req.user._id.toString();
        const otherUserId = req.params.otherUserId;

        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Ensure the other user exists
        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch messages where (sender = userId AND receiver = otherUserId) OR vice versa
        const messages = await ChatMessage.find({
            $or: [
                { sender: mongoose.Types.ObjectId(userId), receiver: mongoose.Types.ObjectId(otherUserId) },
                { sender: mongoose.Types.ObjectId(otherUserId), receiver: mongoose.Types.ObjectId(userId) },
            ],
        })
            .sort({ timestamp: 1 }) // chronological order
            .lean();

        return res.json({ messages });
    } catch (err) {
        console.error('Error in GET /api/chats/:otherUserId:', err);
        return res.status(500).json({ message: 'Server error fetching chat history' });
    }
});

// Add these routes for messaging functionality:

// ---------------------------------------
// Messaging Routes
// ---------------------------------------

// Get user's conversations
app.get('/api/messages/conversations', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId
        })
        .populate('participants', 'name images email')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

        // Calculate unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversation: conv._id,
                    sender: { $ne: userId },
                    readBy: { $not: { $elemMatch: { user: userId } } }
                });

                return {
                    ...conv.toObject(),
                    unreadCount,
                    otherParticipant: conv.participants.find(p => p._id.toString() !== userId.toString())
                };
            })
        );

        return res.json({ conversations: conversationsWithUnread });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return res.status(500).json({ message: 'Failed to fetch conversations' });
    }
});

// Get messages in a conversation
app.get('/api/messages/conversations/:conversationId', protect, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: 'Invalid conversation ID' });
        }

        // Check if user is participant in conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const total = await Message.countDocuments({ conversation: conversationId });
        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'name images')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Mark messages as read
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: userId },
                'readBy.user': { $ne: userId }
            },
            {
                $push: {
                    readBy: {
                        user: userId,
                        readAt: new Date()
                    }
                }
            }
        );

        return res.json({
            messages: messages.reverse(), // Return in chronological order
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

// Send a message
app.post('/api/messages', protect, async (req, res) => {
    try {
        const { recipientId, content, productId } = req.body;
        const senderId = req.user._id;

        if (!recipientId || !content) {
            return res.status(400).json({ message: 'Recipient and content are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ message: 'Invalid recipient ID' });
        }

        // Check if conversation exists
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] }
        });

        // Create conversation if it doesn't exist
        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipientId],
                relatedProduct: productId || null
            });
            await conversation.save();
        }

        // Create message
        const message = new Message({
            conversation: conversation._id,
            sender: senderId,
            content: content.trim(),
            readBy: [{
                user: senderId,
                readAt: new Date()
            }]
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Populate message for response
        await message.populate('sender', 'name images');

        return res.status(201).json({ message: 'Message sent successfully', data: message });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ message: 'Failed to send message' });
    }
});

// ---------------------------------------
// 1. Route: POST /api/products/:id/reviews
//    - Add a new review & rating for a product (protected)
//    - Body: { rating: Number (1–5), comment: String (optional) }
//    - After creating a review, update product’s numReviews & avg rating
// ---------------------------------------
app.post('/api/products/:id/reviews', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const productId = req.params.id;
        const { rating, comment } = req.body;

        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Validate rating
        const numericRating = Number(rating);
        if (!numericRating || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
        }

        // Check if user already submitted a review for this product
        const existingReview = await Review.findOne({
            user: userId,
            product: productId,
        });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // Create and save new review
        const newReview = new Review({
            user: userId,
            product: productId,
            rating: numericRating,
            comment: comment ? comment.trim() : '',
        });
        await newReview.save();

        // Recalculate product’s numReviews and average rating
        const allReviews = await Review.find({ product: productId }).select('rating');
        const numReviews = allReviews.length;
        const avgRating =
            allReviews.reduce((acc, r) => acc + r.rating, 0) / numReviews;

        product.numReviews = numReviews;
        product.rating = avgRating;
        await product.save();

        return res.status(201).json({ message: 'Review submitted successfully' });
    } catch (err) {
        console.error('Error in POST /api/products/:id/reviews:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 2. Route: GET /api/products/:id/reviews
//    - Retrieve all reviews for a given product
//    - Query Params: page, limit
// ---------------------------------------
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const productId = req.params.id;
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;

        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Count total reviews for pagination
        const total = await Review.countDocuments({ product: productId });

        // Fetch reviews, populate user’s name for display
        const reviews = await Review.find({ product: productId })
            .sort({ createdAt: -1 })
            .skip(pageSize * (page - 1))
            .limit(pageSize)
            .populate('user', 'name');

        return res.json({
            reviews,
            page,
            pages: Math.ceil(total / pageSize),
            total,
        });
    } catch (err) {
        console.error('Error in GET /api/products/:id/reviews:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 3. Route: DELETE /api/reviews/:id
//    - Delete a single review (protected; either admin or review author)
// ---------------------------------------
app.delete('/api/reviews/:id', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const reviewId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: 'Invalid review ID' });
        }
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Only the review author or an admin can delete
        if (
            review.user.toString() !== userId.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        const productId = review.product;
        await review.remove();

        // Recalculate product’s numReviews and average rating after deletion
        const remainingReviews = await Review.find({ product: productId }).select('rating');
        const numReviews = remainingReviews.length;
        const avgRating =
            numReviews > 0
                ? remainingReviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
                : 0;

        await Product.findByIdAndUpdate(productId, {
            numReviews,
            rating: avgRating,
        });

        return res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Error in DELETE /api/reviews/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 4. Route: GET /api/reviews/:id
//    - (Optional) Retrieve a single review by its ID
//    - Useful for admin moderation or editing UI
// ---------------------------------------
app.get('/api/reviews/:id', async (req, res) => {
    try {
        const reviewId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: 'Invalid review ID' });
        }
        const review = await Review.findById(reviewId).populate('user', 'name email');
        if (!review) {
           
           
            return res.status(404).json({ message: 'Review not found' });
        }

        return res.json(review);
    } catch (err) {
        console.error('Error in GET /api/reviews/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});


app.post('/api/tickets', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, relatedOrder, relatedProduct, subject, description } = req.body;

        // Validate required fields
        if (!['complaint', 'dispute'].includes(type)) {
            return res.status(400).json({ message: 'Type must be either "complaint" or "dispute"' });
        }
        if (!subject || !subject.trim() || !description || !description.trim()) {
            return res.status(400).json({ message: 'Subject and description are required' });
        }

        // If dispute, relatedOrder is required and must exist
        if (type === 'dispute') {
            if (!relatedOrder || !mongoose.Types.ObjectId.isValid(relatedOrder)) {
                return res.status(400).json({ message: 'A valid relatedOrder ID is required for disputes' });
            }
            const order = await Order.findById(relatedOrder);
            if (!order || order.user.toString() !== userId.toString()) {
                return res.status(404).json({ message: 'Order not found or not owned by you' });
            }
        }

        // If complaint, relatedProduct is required and must exist
        if (type === 'complaint') {
            if (!relatedProduct || !mongoose.Types.ObjectId.isValid(relatedProduct)) {
                return res.status(400).json({ message: 'A valid relatedProduct ID is required for complaints' });
            }
            const product = await Product.findById(relatedProduct);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
        }

        const newTicket = new Ticket({
            user: userId,
            type,
            relatedOrder: type === 'dispute' ? relatedOrder : undefined,
            relatedProduct: type === 'complaint' ? relatedProduct : undefined,
            subject: subject.trim(),
            description: description.trim(),
            status: 'open',
            messages: [
                {
                    sender: userId,
                    content: description.trim(),
                },
            ],
            assignedTo: null,
        });

        const created = await newTicket.save();
        return res.status(201).json(created);
    } catch (err) {
        console.error('Error in POST /api/tickets:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 2.2 Get all tickets created by the authenticated user
//     GET /api/tickets/my
//     Query Params: page, limit
//     Protected
app.get('/api/tickets/my', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;

        const total = await Ticket.countDocuments({ user: userId });
        const tickets = await Ticket.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(pageSize * (page - 1))
            .limit(pageSize)
            .select('-messages') // omit messages list for summary view
            .lean();

        return res.json({
            tickets,
            page,
            pages: Math.ceil(total / pageSize),
            total,
        });
    } catch (err) {
        console.error('Error in GET /api/tickets/my:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 2.3 Get full details (including message thread) of a specific ticket owned by the user
//     GET /api/tickets/my/:ticketId
//     Protected


app.post('/api/tickets', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, relatedOrder, relatedProduct, subject, description } = req.body;

        // Validate required fields
        if (!['complaint', 'dispute'].includes(type)) {
            return res.status(400).json({ message: 'Type must be either "complaint" or "dispute"' });
        }
        if (!subject || !subject.trim() || !description || !description.trim()) {
            return res.status(400).json({ message: 'Subject and description are required' });
        }

        // If dispute, relatedOrder is required and must exist
        if (type === 'dispute') {
            if (!relatedOrder || !mongoose.Types.ObjectId.isValid(relatedOrder)) {
                return res.status(400).json({ message: 'A valid relatedOrder ID is required for disputes' });
            }
            const order = await Order.findById(relatedOrder);
            if (!order || order.user.toString() !== userId.toString()) {
                return res.status(404).json({ message: 'Order not found or not owned by you' });
            }
        }

        // If complaint, relatedProduct is required and must exist
        if (type === 'complaint') {
            if (!relatedProduct || !mongoose.Types.ObjectId.isValid(relatedProduct)) {
                return res.status(400).json({ message: 'A valid relatedProduct ID is required for complaints' });
            }
            const product = await Product.findById(relatedProduct);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
        }

        const newTicket = new Ticket({
            user: userId,
            type,
            relatedOrder: type === 'dispute' ? relatedOrder : undefined,
            relatedProduct: type === 'complaint' ? relatedProduct : undefined,
            subject: subject.trim(),
            description: description.trim(),
            status: 'open',
            messages: [
                {
                    sender: userId,
                    content: description.trim(),
                },
            ],
            assignedTo: null,
        });

        const created = await newTicket.save();
        return res.status(201).json(created);
    } catch (err) {
        console.error('Error in POST /api/tickets:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 2.2 Get all tickets created by the authenticated user
//     GET /api/tickets/my
//     Query Params: page, limit
//     Protected
app.get('/api/tickets/my', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;

        const total = await Ticket.countDocuments({ user: userId });
        const tickets = await Ticket.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(pageSize * (page - 1))
            .limit(pageSize)
            .select('-messages') // omit messages list for summary view
            .lean();

        return res.json({
            tickets,
            page,
            pages: Math.ceil(total / pageSize),
            total,
        });
    } catch (err) {
        console.error('Error in GET /api/tickets/my:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 2.3 Get full details (including message thread) of a specific ticket owned by the user
//     GET /api/tickets/my/:ticketId
//     Protected
app.get('/api/tickets/my/:ticketId', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const ticketId = req.params.ticketId;

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ message: 'Invalid ticket ID' });
        }

        const ticket = await Ticket.findById(ticketId)
            .populate('messages.sender', 'name email')
            .populate('relatedOrder', 'orderItems totalPrice')
            .populate('relatedProduct', 'name price');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        if (ticket.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Access denied: Not your ticket' });
        }

        return res.json(ticket);
    } catch (err) {
        console.error('Error in GET /api/tickets/my/:ticketId:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 2.4 User adds a follow-up message to their own ticket (if it’s still open/in_progress)
//     POST /api/tickets/my/:ticketId/message
//     Body: { content: String }
//     Protected
app.post('/api/tickets/my/:ticketId/message', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const ticketId = req.params.ticketId;
        const { content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ message: 'Invalid ticket ID' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        if (ticket.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Access denied: Not your ticket' });
        }
        if (['resolved', 'closed'].includes(ticket.status)) {
            return res.status(400).json({ message: 'Cannot add messages to a resolved or closed ticket' });
        }

        ticket.messages.push({
            sender: userId,
            content: content.trim(),
        });
        ticket.status = 'in_progress'; // escalate if user follows up
        ticket.updatedAt = Date.now();

        const updated = await ticket.save();
        return res.json(updated);
    } catch (err) {
        console.error('Error in POST /api/tickets/my/:ticketId/message:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// -----------------------------------------------------------------------------
// 3. Admin Routes to Manage All Tickets & Resolve Disputes
// -----------------------------------------------------------------------------

// Middleware to check admin role
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};

// 3.1 Get all tickets (with optional filters by type/status)
//     GET /api/admin/tickets
//     Query Params: type, status, page, limit
//     Protected + adminOnly
app.get('/api/admin/tickets', protect, adminOnly, async (req, res) => {
    try {
        const { type, status } = req.query;
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;

        const filter = {};
        if (type && ['complaint', 'dispute'].includes(type)) filter.type = type;
        if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) filter.status = status;

        const total = await Ticket.countDocuments(filter);
        const tickets = await Ticket.find(filter)
            .sort({ createdAt: -1 })
            .skip(pageSize * (page - 1))
            .limit(pageSize)
            .populate('user', 'name email')
            .select('-messages') // summary view
            .lean();

        return res.json({
            tickets,
            page,
            pages: Math.ceil(total / pageSize),
            total,
        });
    } catch (err) {
        console.error('Error in GET /api/admin/tickets:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 3.2 Get full details of a ticket (including all messages) by ticket ID
//     GET /api/admin/tickets/:ticketId
//     Protected + adminOnly
app.get('/api/admin/tickets/:ticketId', protect, adminOnly, async (req, res) => {
    try {
        const ticketId = req.params.ticketId;

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ message: 'Invalid ticket ID' });
        }

        const ticket = await Ticket.findById(ticketId)
            .populate('user', 'name email')
            .populate('messages.sender', 'name email')
            .populate('relatedOrder', 'orderItems totalPrice')
            .populate('relatedProduct', 'name price');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        return res.json(ticket);
    } catch (err) {
        console.error('Error in GET /api/admin/tickets/:ticketId:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 3.3 Admin posts a response message and/or updates ticket status/assignment
//     PUT /api/admin/tickets/:ticketId
//     Body: {
//       message: String (optional),
//       status: 'open' | 'in_progress' | 'resolved' | 'closed' (optional),
//       assignTo: adminUserId (optional: assign or reassign ticket)
//     }
//     Protected + adminOnly
app.put('/api/admin/tickets/:ticketId', protect, adminOnly, async (req, res) => {
    try {
        const adminId = req.user._id;
        const ticketId = req.params.ticketId;
        const { message, status, assignTo } = req.body;

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ message: 'Invalid ticket ID' });
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Validate and update status
        if (status) {
            if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status value' });
            }
            ticket.status = status;
        }

        // Validate and update assignedTo
        if (assignTo) {
            if (!mongoose.Types.ObjectId.isValid(assignTo)) {
                return res.status(400).json({ message: 'Invalid admin user ID for assignment' });
            }
            const adminUser = await User.findById(assignTo);
            if (!adminUser || adminUser.role !== 'admin') {
                return res.status(400).json({ message: 'Assigned user must be a valid admin' });
            }
            ticket.assignedTo = assignTo;
        }

        // Add admin message if provided
        if (message && message.trim()) {
            ticket.messages.push({
                sender: adminId,
                content: message.trim(),
            });
        }

        ticket.updatedAt = Date.now();
        const updatedTicket = await ticket.save();

        // Populate before returning
        const populated = await Ticket.findById(updatedTicket._id)
            .populate('user', 'name email')
            .populate('messages.sender', 'name email')
            .populate('relatedOrder', 'orderItems totalPrice')
            .populate('relatedProduct', 'name price')
            .populate('assignedTo', 'name email');

        return res.json(populated);
    } catch (err) {
        console.error('Error in PUT /api/admin/tickets/:ticketId:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// 3.4 Admin closes (or reopens) a ticket without adding a message
//     PATCH /api/admin/tickets/:ticketId/status
//     Body: { status: 'resolved' | 'closed' | 'open' | 'in_progress' }
//     Protected + adminOnly
app.patch('/api/admin/tickets/:ticketId/status', protect, adminOnly, async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ message: 'Invalid ticket ID' });
        }
        if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.status = status;
        ticket.updatedAt = Date.now();
        const updated = await ticket.save();

        return res.json({ message: `Ticket status updated to ${status}`, ticketId: updated._id });
    } catch (err) {
        console.error('Error in PATCH /api/admin/tickets/:ticketId/status:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// MISSING ROUTES - Need to add these:

// Get all categories for filter dropdown
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find({})
            .populate('parent', 'name slug')
            .sort({ name: 1 });
        return res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/categories/hierarchy', async (req, res) => {
    try {
        const parentCategories = await Category.find({ parent: null }).sort({ name: 1 });
        const categoriesWithChildren = await Promise.all(
            parentCategories.map(async (parent) => {
                const children = await Category.find({ parent: parent._id }).sort({ name: 1 });
                return {
                    ...parent.toObject(),
                    children
                };
            })
        );
        return res.json(categoriesWithChildren);
    } catch (err) {
        console.error('Error fetching category hierarchy:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Create new category (admin only)
app.post('/api/categories', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        
        const { name, slug, parent, description } = req.body;
        
        if (!name || !slug) {
            return res.status(400).json({ message: 'Name and slug are required' });
        }

        const category = new Category({
            name: name.trim(),
            slug: slug.toLowerCase().trim(),
            parent: parent && mongoose.Types.ObjectId.isValid(parent) ? parent : null,
            description: description ? description.trim() : ''
        });

        const created = await category.save();
        return res.status(201).json(created);
    } catch (err) {
        console.error('Error creating category:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/products/featured', async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 10;
        
        const featuredProducts = await Product.find({ 
            isFeatured: true,
            countInStock: { $gt: 0 },
            $or: [
                { featuredUntil: null },
                { featuredUntil: { $gte: new Date() } }
            ]
        })
        .populate('seller', 'name images')
        .populate('categories', 'name slug')
        .sort({ createdAt: -1 })
        .limit(limit);

        return res.json({ products: featuredProducts });
    } catch (err) {
        console.error('Error fetching featured products:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});


app.get('/api/wishlists', protect, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate('items.product', 'name price images seller')
            .populate('items.product.seller', 'name');

        if (!wishlist) {
            return res.json({ items: [] });
        }

        return res.json(wishlist);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return res.status(500).json({ message: 'Failed to fetch wishlist' });
    }
});

app.post('/api/wishlists/product/:productId', protect, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let wishlist = await Wishlist.findOne({ user: userId });
        
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }

        // Check if item already in wishlist
        const existingItem = wishlist.items.find(item => 
            item.product.toString() === productId
        );

        if (existingItem) {
            // Remove from wishlist
            wishlist.items = wishlist.items.filter(item => 
                item.product.toString() !== productId
            );
            await wishlist.save();
            return res.json({ message: 'Removed from wishlist', inWishlist: false });
        } else {
            // Add to wishlist
            wishlist.items.push({ product: productId });
            await wishlist.save();
            return res.json({ message: 'Added to wishlist', inWishlist: true });
        }
    } catch (error) {
        console.error('Error updating wishlist:', error);
        return res.status(500).json({ message: 'Failed to update wishlist' });
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
