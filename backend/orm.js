import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

const { Schema } = mongoose;

async function initDB() {
    if (!MONGO_URI) {
        throw new Error('MONGO_URI environment variable not set');
    }
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        throw err;
    }
}

const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
        profile: {
            bio: String,
            avatarUrl: String,
        },
    },
    { timestamps: true }
);
const User = mongoose.model('User', userSchema);


const productSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        price: { type: Number, required: true, min: 0 },
        seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        images: [String],
        category: String,
        stock: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);
const Product = mongoose.model('Product', productSchema);


const cartItemSchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1, min: 1 },
    },
    { _id: false }
);
const cartSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        items: [cartItemSchema],
    },
    { timestamps: true }
);
const Cart = mongoose.model('Cart', cartSchema);


const orderItemSchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);
const orderSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: [orderItemSchema],
        total: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], default: 'pending' },
    },
    { timestamps: true }
);
const Order = mongoose.model('Order', orderSchema);

export  {
    initDB,
    User,
    Product,
    Cart,
    Order,
};


