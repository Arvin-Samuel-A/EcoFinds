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
    Auction,
    Conversation,
    Message
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

// Middleware to check admin role
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};

// ---------------------------------------
// 3. IMAGE UPLOAD ROUTES
// ---------------------------------------
app.post('/api/upload/image', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const folder = req.query.folder || 'profiles';
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
// 4. USER ROUTES
// ---------------------------------------

// Register a new user
app.post('/api/users/register', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            phone,
            images,
        } = req.body;

        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ message: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: role && ['buyer', 'seller', 'admin'].includes(role) ? role : 'buyer',
            phone: phone ? phone.trim() : undefined,
            images: images && images.url && images.gcpStoragePath ? {
                url: images.url.trim(),
                gcpStoragePath: images.gcpStoragePath.trim(),
                altText: images.altText ? images.altText.trim() : name.trim(),
                isPrimary: true,
            } : undefined,
        });

        await user.save();

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

// User login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

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

// Get current user profile
app.get('/api/users/profile', protect, async (req, res) => {
    try {
        const user = req.user;
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

// Update user profile
app.put('/api/users/profile', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email, phone, bio, location, currentPassword, newPassword } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (email !== user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
            if (existingUser && existingUser._id.toString() !== userId.toString()) {
                return res.status(400).json({ message: 'Email already in use by another account' });
            }
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to set new password' });
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            const saltRounds = 12;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
            user.passwordHash = hashedNewPassword;
        }

        user.name = name.trim();
        user.email = email.toLowerCase().trim();
        user.phone = phone ? phone.trim() : user.phone;
        user.bio = bio ? bio.trim() : user.bio;
        user.location = location ? location.trim() : user.location;

        const updatedUser = await user.save();

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

// Update profile image
app.put('/api/users/profile/image', protect, upload.single('image'), async (req, res) => {
    try {
        const user = req.user;

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        if (user.images && user.images.gcpStoragePath) {
            await deleteFromGCP(user.images.gcpStoragePath);
        }

        const uploadResult = await uploadToGCP(req.file, 'profiles');

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

// Get any user by ID (admin only)
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
// 5. ADDRESS MANAGEMENT ROUTES
// ---------------------------------------

// Add a new address
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

// Update an existing address by index
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

// Delete an address by index
app.delete('/api/users/profile/addresses/:idx', protect, async (req, res) => {
    try {
        const user = req.user;
        const idx = parseInt(req.params.idx, 10);

        if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
            return res.status(400).json({ message: 'Invalid address index' });
        }

        const removed = user.addresses.splice(idx, 1);
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

// Set an address as default by index
app.put('/api/users/profile/addresses/:idx/default', protect, async (req, res) => {
    try {
        const user = req.user;
        const idx = parseInt(req.params.idx, 10);

        if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
            return res.status(400).json({ message: 'Invalid address index' });
        }

        user.addresses.forEach((a) => {
            a.isDefault = false;
        });

        user.addresses[idx].isDefault = true;

        const updatedUser = await user.save();
        return res.json({ addresses: updatedUser.addresses });
    } catch (err) {
        console.error('Error in PUT /api/users/profile/addresses/:idx/default:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 6. PRODUCT ROUTES
// ---------------------------------------

// Create a new product
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

        if (!name || !slug || !description || !price || !countInStock || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                message:
                    'Required fields: name, slug, description, price, countInStock, and at least one image (with url & gcpStoragePath)',
            });
        }

        for (const img of images) {
            if (!img.url || !img.gcpStoragePath) {
                return res
                    .status(400)
                    .json({ message: 'Each image must include both url and gcpStoragePath' });
            }
        }

        let categoryDocs = [];
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            categoryDocs = await Category.find({ _id: { $in: categoryIds } });
            if (categoryDocs.length !== categoryIds.length) {
                return res.status(400).json({ message: 'One or more category IDs are invalid' });
            }
        }

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

// Get products with filters and pagination
app.get('/api/products', async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;
        
        const keyword = req.query.keyword
            ? {
                $or: [
                    { name: { $regex: req.query.keyword.trim(), $options: 'i' } },
                    { description: { $regex: req.query.keyword.trim(), $options: 'i' } },
                    { brand: { $regex: req.query.keyword.trim(), $options: 'i' } }
                ]
            }
            : {};

        const categoryFilter = req.query.category
            ? { categories: mongoose.Types.ObjectId(req.query.category) }
            : {};

        const priceFilter = {};
        if (req.query.minPrice) priceFilter.price = { $gte: Number(req.query.minPrice) };
        if (req.query.maxPrice) {
            if (priceFilter.price) {
                priceFilter.price.$lte = Number(req.query.maxPrice);
            } else {
                priceFilter.price = { $lte: Number(req.query.maxPrice) };
            }
        }

        const stockFilter = req.query.inStock === 'true' ? { countInStock: { $gt: 0 } } : {};
        const ratingFilter = req.query.minRating ? { rating: { $gte: Number(req.query.minRating) } } : {};

        const filter = { 
            ...keyword, 
            ...categoryFilter, 
            ...priceFilter, 
            ...stockFilter, 
            ...ratingFilter 
        };

        let sortOption = { createdAt: -1 };
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

// Get featured products
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

// Get user's listings (both products and auctions)
app.get('/api/products/my-listings', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        
        const products = await Product.find({ seller: userId })
            .populate('seller', 'name email images')
            .populate('categories', 'name slug')
            .sort({ createdAt: -1 });

        const auctions = await Auction.find({ seller: userId })
            .populate('seller', 'name email images')
            .sort({ createdAt: -1 });

        const formattedProducts = products.map(product => ({
            ...product.toObject(),
            type: 'product',
            listingId: product._id,
            status: product.countInStock > 0 ? 'active' : 'out_of_stock'
        }));

        const formattedAuctions = auctions.map(auction => {
            const now = new Date();
            let auctionStatus = auction.status;
            
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

// Get a single product by ID
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

        if (!product.seller.rating) {
            product.seller.rating = 4.5;
        }

        return res.json(product);
    } catch (err) {
        console.error('Error in GET /api/products/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Update an existing product
app.put('/api/products/:id', protect, async (req, res) => {
    try {
        const user = req.user;
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
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

// Delete a product
app.delete('/api/products/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        }

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
// 7. AUCTION ROUTES
// ---------------------------------------

// Create a new auction
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

// Get all auctions
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

        const total = await Auction.countDocuments(filter);
        const auctions = await Auction.find(filter)
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

// Get specific auction details
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

        const now = new Date();
        let currentStatus = auction.status;
        
        if (auction.status === 'upcoming' && now >= auction.startTime) {
            currentStatus = 'live';
            await Auction.findByIdAndUpdate(req.params.id, { status: 'live' });
        } else if (auction.status === 'live' && now >= auction.endTime) {
            currentStatus = 'ended';
            await Auction.findByIdAndUpdate(req.params.id, { status: 'ended' });
        }

        auction.status = currentStatus;
        auction.timeRemaining = currentStatus === 'live' ? Math.max(0, auction.endTime - now) : 0;
        auction.bidCount = auction.bids.length;

        return res.json(auction);
    } catch (err) {
        console.error('Error in GET /api/auctions/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Place a bid on an auction
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

        const bidAmount = Number(req.body.amount);
        if (isNaN(bidAmount) || bidAmount <= auction.currentPrice) {
            return res
                .status(400)
                .json({ message: `Bid must exceed current price (${auction.currentPrice})` });
        }

        auction.bids.push({
            bidder: userId,
            amount: bidAmount,
            timestamp: now,
        });
        auction.currentPrice = bidAmount;

        if (auction.status === 'upcoming') {
            auction.status = 'live';
            auction.startTime = now;
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
// 8. CATEGORY ROUTES
// ---------------------------------------

// Get all categories
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

// Get category hierarchy
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
app.post('/api/categories', protect, adminOnly, async (req, res) => {
    try {
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

// ---------------------------------------
// 9. CART ROUTES
// ---------------------------------------

// Get current user's cart
app.get('/api/cart', protect, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price images countInStock seller')
            .populate('items.product.seller', 'name');

        if (!cart) {
            return res.json({ items: [], totalItems: 0, totalPrice: 0 });
        }

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

// Add to cart
app.post('/api/cart', protect, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

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

        const existingItemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > product.countInStock) {
                return res.status(400).json({ message: 'Not enough stock available' });
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            cart.items.push({
                product: productId,
                quantity: quantity,
                priceAtAddition: product.price
            });
        }

        cart.updatedAt = new Date();
        await cart.save();

        await cart.populate('items.product', 'name price images countInStock');
        
        return res.json({ message: 'Item added to cart', cart });
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({ message: 'Failed to add to cart' });
    }
});

// Update cart item quantity
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

        const product = await Product.findById(productId).select('countInStock');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.countInStock < qty) {
            return res.status(400).json({ message: 'Requested quantity exceeds stock' });
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

        cart.items[itemIndex].quantity = qty;
        cart.updatedAt = Date.now();
        const updatedCart = await cart.save();

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

// Remove single product from cart
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

        cart.items.splice(itemIndex, 1);
        cart.updatedAt = Date.now();
        const updatedCart = await cart.save();

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

// Clear entire cart
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
// 10. ORDER ROUTES
// ---------------------------------------

// Get user's orders (legacy route)
app.get('/api/orders/myorders', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;

        const total = await Order.countDocuments({ user: userId });

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

// Get user's orders with enhanced details (for Previous Purchases feature)
app.get('/api/orders/my-orders', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const status = req.query.status;

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

// Get single order details
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

// ---------------------------------------
// 11. REVIEW ROUTES
// ---------------------------------------

// Add a review for a product
app.post('/api/products/:id/reviews', protect, async (req, res) => {
    try {
        const productId = req.params.id;
        const { rating, comment, orderId } = req.body;
        const userId = req.user._id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

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

        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        const review = new Review({
            user: userId,
            product: productId,
            rating: Number(rating),
            comment: comment ? comment.trim() : '',
            orderId: orderId || null
        });

        await review.save();

        const reviews = await Review.find({ product: productId });
        const numReviews = reviews.length;
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / numReviews;

        await Product.findByIdAndUpdate(productId, {
            rating: avgRating,
            numReviews: numReviews
        });

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

// Get reviews for a product
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

// Delete a review
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

        if (
            review.user.toString() !== userId.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        const productId = review.product;
        await review.remove();

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

// Get a single review by ID
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

// ---------------------------------------
// 12. WISHLIST ROUTES
// ---------------------------------------

// Get user's wishlist
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

// Add/remove product from wishlist
app.post('/api/wishlists/product/:productId', protect, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let wishlist = await Wishlist.findOne({ user: userId });
        
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }

        const existingItem = wishlist.items.find(item => 
            item.product.toString() === productId
        );

        if (existingItem) {
            wishlist.items = wishlist.items.filter(item => 
                item.product.toString() !== productId
            );
            await wishlist.save();
            return res.json({ message: 'Removed from wishlist', inWishlist: false });
        } else {
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
// 13. SAVED SEARCHES ROUTES
// ---------------------------------------

// Create a new saved search
app.// filepath: c:\Users\dell\OneDrive\Desktop\IITM\EcoFinds\backend\app.js
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
    Auction,
    Conversation,
    Message
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

// Middleware to check admin role
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};

// ---------------------------------------
// 3. IMAGE UPLOAD ROUTES
// ---------------------------------------
app.post('/api/upload/image', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const folder = req.query.folder || 'profiles';
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
// 4. USER ROUTES
// ---------------------------------------

// Register a new user
app.post('/api/users/register', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            phone,
            images,
        } = req.body;

        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ message: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: role && ['buyer', 'seller', 'admin'].includes(role) ? role : 'buyer',
            phone: phone ? phone.trim() : undefined,
            images: images && images.url && images.gcpStoragePath ? {
                url: images.url.trim(),
                gcpStoragePath: images.gcpStoragePath.trim(),
                altText: images.altText ? images.altText.trim() : name.trim(),
                isPrimary: true,
            } : undefined,
        });

        await user.save();

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

// User login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

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

// Get current user profile
app.get('/api/users/profile', protect, async (req, res) => {
    try {
        const user = req.user;
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

// Update user profile
app.put('/api/users/profile', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email, phone, bio, location, currentPassword, newPassword } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (email !== user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
            if (existingUser && existingUser._id.toString() !== userId.toString()) {
                return res.status(400).json({ message: 'Email already in use by another account' });
            }
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to set new password' });
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            const saltRounds = 12;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
            user.passwordHash = hashedNewPassword;
        }

        user.name = name.trim();
        user.email = email.toLowerCase().trim();
        user.phone = phone ? phone.trim() : user.phone;
        user.bio = bio ? bio.trim() : user.bio;
        user.location = location ? location.trim() : user.location;

        const updatedUser = await user.save();

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

// Update profile image
app.put('/api/users/profile/image', protect, upload.single('image'), async (req, res) => {
    try {
        const user = req.user;

        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        if (user.images && user.images.gcpStoragePath) {
            await deleteFromGCP(user.images.gcpStoragePath);
        }

        const uploadResult = await uploadToGCP(req.file, 'profiles');

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

// Get any user by ID (admin only)
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
// 5. ADDRESS MANAGEMENT ROUTES
// ---------------------------------------

// Add a new address
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

// Update an existing address by index
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

// Delete an address by index
app.delete('/api/users/profile/addresses/:idx', protect, async (req, res) => {
    try {
        const user = req.user;
        const idx = parseInt(req.params.idx, 10);

        if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
            return res.status(400).json({ message: 'Invalid address index' });
        }

        const removed = user.addresses.splice(idx, 1);
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

// Set an address as default by index
app.put('/api/users/profile/addresses/:idx/default', protect, async (req, res) => {
    try {
        const user = req.user;
        const idx = parseInt(req.params.idx, 10);

        if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
            return res.status(400).json({ message: 'Invalid address index' });
        }

        user.addresses.forEach((a) => {
            a.isDefault = false;
        });

        user.addresses[idx].isDefault = true;

        const updatedUser = await user.save();
        return res.json({ addresses: updatedUser.addresses });
    } catch (err) {
        console.error('Error in PUT /api/users/profile/addresses/:idx/default:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------
// 6. PRODUCT ROUTES
// ---------------------------------------

// Create a new product
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

        if (!name || !slug || !description || !price || !countInStock || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                message:
                    'Required fields: name, slug, description, price, countInStock, and at least one image (with url & gcpStoragePath)',
            });
        }

        for (const img of images) {
            if (!img.url || !img.gcpStoragePath) {
                return res
                    .status(400)
                    .json({ message: 'Each image must include both url and gcpStoragePath' });
            }
        }

        let categoryDocs = [];
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {
            categoryDocs = await Category.find({ _id: { $in: categoryIds } });
            if (categoryDocs.length !== categoryIds.length) {
                return res.status(400).json({ message: 'One or more category IDs are invalid' });
            }
        }

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

// Get products with filters and pagination
app.get('/api/products', async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;
        
        const keyword = req.query.keyword
            ? {
                $or: [
                    { name: { $regex: req.query.keyword.trim(), $options: 'i' } },
                    { description: { $regex: req.query.keyword.trim(), $options: 'i' } },
                    { brand: { $regex: req.query.keyword.trim(), $options: 'i' } }
                ]
            }
            : {};

        const categoryFilter = req.query.category
            ? { categories: mongoose.Types.ObjectId(req.query.category) }
            : {};

        const priceFilter = {};
        if (req.query.minPrice) priceFilter.price = { $gte: Number(req.query.minPrice) };
        if (req.query.maxPrice) {
            if (priceFilter.price) {
                priceFilter.price.$lte = Number(req.query.maxPrice);
            } else {
                priceFilter.price = { $lte: Number(req.query.maxPrice) };
            }
        }

        const stockFilter = req.query.inStock === 'true' ? { countInStock: { $gt: 0 } } : {};
        const ratingFilter = req.query.minRating ? { rating: { $gte: Number(req.query.minRating) } } : {};

        const filter = { 
            ...keyword, 
            ...categoryFilter, 
            ...priceFilter, 
            ...stockFilter, 
            ...ratingFilter 
        };

        let sortOption = { createdAt: -1 };
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

// Get featured products
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

// Get user's listings (both products and auctions)
app.get('/api/products/my-listings', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        
        const products = await Product.find({ seller: userId })
            .populate('seller', 'name email images')
            .populate('categories', 'name slug')
            .sort({ createdAt: -1 });

        const auctions = await Auction.find({ seller: userId })
            .populate('seller', 'name email images')
            .sort({ createdAt: -1 });

        const formattedProducts = products.map(product => ({
            ...product.toObject(),
            type: 'product',
            listingId: product._id,
            status: product.countInStock > 0 ? 'active' : 'out_of_stock'
        }));

        const formattedAuctions = auctions.map(auction => {
            const now = new Date();
            let auctionStatus = auction.status;
            
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

// Get a single product by ID
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

        if (!product.seller.rating) {
            product.seller.rating = 4.5;
        }

        return res.json(product);
    } catch (err) {
        console.error('Error in GET /api/products/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Update an existing product
app.put('/api/products/:id', protect, async (req, res) => {
    try {
        const user = req.user;
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
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

// Delete a product
app.delete('/api/products/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        }

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
// 7. AUCTION ROUTES
// ---------------------------------------

// Create a new auction
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

// Get all auctions
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

        const total = await Auction.countDocuments(filter);
        const auctions = await Auction.find(filter)
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

// Get specific auction details
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

        const now = new Date();
        let currentStatus = auction.status;
        
        if (auction.status === 'upcoming' && now >= auction.startTime) {
            currentStatus = 'live';
            await Auction.findByIdAndUpdate(req.params.id, { status: 'live' });
        } else if (auction.status === 'live' && now >= auction.endTime) {
            currentStatus = 'ended';
            await Auction.findByIdAndUpdate(req.params.id, { status: 'ended' });
        }

        auction.status = currentStatus;
        auction.timeRemaining = currentStatus === 'live' ? Math.max(0, auction.endTime - now) : 0;
        auction.bidCount = auction.bids.length;

        return res.json(auction);
    } catch (err) {
        console.error('Error in GET /api/auctions/:id:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Place a bid on an auction
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

        const bidAmount = Number(req.body.amount);
        if (isNaN(bidAmount) || bidAmount <= auction.currentPrice) {
            return res
                .status(400)
                .json({ message: `Bid must exceed current price (${auction.currentPrice})` });
        }

        auction.bids.push({
            bidder: userId,
            amount: bidAmount,
            timestamp: now,
        });
        auction.currentPrice = bidAmount;

        if (auction.status === 'upcoming') {
            auction.status = 'live';
            auction.startTime = now;
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
// 8. CATEGORY ROUTES
// ---------------------------------------

// Get all categories
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

// Get category hierarchy
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
app.post('/api/categories', protect, adminOnly, async (req, res) => {
    try {
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

// ---------------------------------------
// 9. CART ROUTES
// ---------------------------------------

// Get current user's cart
app.get('/api/cart', protect, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price images countInStock seller')
            .populate('items.product.seller', 'name');

        if (!cart) {
            return res.json({ items: [], totalItems: 0, totalPrice: 0 });
        }

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

// Add to cart
app.post('/api/cart', protect, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

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

        const existingItemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId
 …