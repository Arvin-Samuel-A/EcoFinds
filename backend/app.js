import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

import { initDB, User, Product, Cart, Order } from './orm.js';
import { authenticateJWT, authorizeRoles, validateBody, errorHandler } from './middleware.js';

// Load environment variables
dotenv.config();

// Initialize DB
initDB().catch(err => {
    console.error('Failed to initialize DB', err);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// JOI Schemas
const registerSchema = Joi.object({ name: Joi.string().required(), email: Joi.string().email().required(), password: Joi.string().min(6).required() });
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
const profileSchema = Joi.object({ name: Joi.string(), profile: Joi.object({ bio: Joi.string(), avatarUrl: Joi.string().uri() }) });
const productSchema = Joi.object({ title: Joi.string().required(), description: Joi.string().allow(''), price: Joi.number().min(0).required(), category: Joi.string().allow(''), stock: Joi.number().min(0), images: Joi.array().items(Joi.string().uri()) });
const cartSchema = Joi.object({ productId: Joi.string().required(), quantity: Joi.number().min(1) });

// Utils
const tokenSign = (user) => {
    const payload = { id: user._id, role: user.role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// Routes
// Auth
app.post('/api/auth/register', validateBody(registerSchema), async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Email already in use' });
        const user = new User({ name, email, password });
        await user.save();
        const token = tokenSign(user);
        res.status(201).json({ token });
    } catch (err) {
        next(err);
    }
});

app.post('/api/auth/login', validateBody(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.password !== password) return res.status(401).json({ message: 'Invalid credentials' });
        const token = tokenSign(user);
        res.json({ token });
    } catch (err) {
        next(err);
    }
});

// Users
app.get('/api/users/me', authenticateJWT, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        next(err);
    }
});

app.put('/api/users/me', authenticateJWT, validateBody(profileSchema), async (req, res, next) => {
    try {
        const update = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        next(err);
    }
});

// Products
app.get('/api/products', async (req, res, next) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        next(err);
    }
});

app.get('/api/products/:id', async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        next(err);
    }
});

app.post('/api/products', authenticateJWT, authorizeRoles('seller', 'admin'), validateBody(productSchema), async (req, res, next) => {
    try {
        const prod = new Product({ ...req.body, seller: req.user.id });
        await prod.save();
        res.status(201).json(prod);
    } catch (err) {
        next(err);
    }
});

app.put('/api/products/:id', authenticateJWT, authorizeRoles('seller', 'admin'), validateBody(productSchema), async (req, res, next) => {
    try {
        const prod = await Product.findById(req.params.id);
        if (!prod) return res.status(404).json({ message: 'Product not found' });
        if (prod.seller.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
        Object.assign(prod, req.body);
        await prod.save();
        res.json(prod);
    } catch (err) {
        next(err);
    }
});

app.delete('/api/products/:id', authenticateJWT, authorizeRoles('seller', 'admin'), async (req, res, next) => {
    try {
        const prod = await Product.findById(req.params.id);
        if (!prod) return res.status(404).json({ message: 'Product not found' });
        if (prod.seller.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
        await prod.remove();
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

// Cart
app.get('/api/cart', authenticateJWT, async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        if (!cart) cart = { items: [] };
        res.json(cart);
    } catch (err) {
        next(err);
    }
});

app.post('/api/cart', authenticateJWT, validateBody(cartSchema), async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) cart = new Cart({ user: req.user.id, items: [] });
        const item = cart.items.find(i => i.product.toString() === productId);
        if (item) item.quantity += quantity; else cart.items.push({ product: productId, quantity });
        await cart.save();
        res.json(cart);
    } catch (err) {
        next(err);
    }
});

app.delete('/api/cart/:productId', authenticateJWT, async (req, res, next) => {
    try {
        const { productId } = req.params;
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });
        cart.items = cart.items.filter(i => i.product.toString() !== productId);
        await cart.save();
        res.json(cart);
    } catch (err) {
        next(err);
    }
});

// Orders
app.get('/api/orders', authenticateJWT, async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user.id });
        res.json(orders);
    } catch (err) {
        next(err);
    }
});

app.post('/api/orders', authenticateJWT, async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        if (!cart || !cart.items.length) return res.status(400).json({ message: 'Cart is empty' });
        const items = cart.items.map(i => ({ product: i.product._id, quantity: i.quantity, price: i.product.price }));
        const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const order = new Order({ user: req.user.id, items, total });
        await order.save();
        cart.items = [];
        await cart.save();
        res.status(201).json(order);
    } catch (err) {
        next(err);
    }
});

app.get('/api/products/search', async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Missing search query' });
        }
        const products = await Product.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        });
        res.json(products);
    } catch (err) {
        next(err);
    }
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
