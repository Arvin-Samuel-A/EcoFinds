// orm.js
// Mongoose schemas and models for an Amazon-level e-commerce platform
// Using ES Module syntax and designed to store image URLs hosted on GCP

import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/* ============================
   1. Address Subschema
   ============================ */
const addressSchema = new Schema(
    {
        fullName: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
    },
    { _id: false }
);

/* ============================
   2. User Schema & Model
   ============================ */
const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true }, // Store bcrypt or similar hash
        role: {
            type: String,
            enum: ['buyer', 'seller', 'admin'],
            default: 'buyer',
        },
        addresses: [addressSchema],
        // Optionally, store payment methods, but sensitive info should be tokenized via a payment gateway
        phone: { type: String },
        isVerified: { type: Boolean, default: false },
        images:
        {
            url: { type: String},               // e.g., https://storage.googleapis.com/my-bucket/image.jpg
            gcpStoragePath: { type: String },     // e.g., my-bucket/images/product1234.jpg
            altText: { type: String },                            // For accessibility/SEO
            isPrimary: { type: Boolean },         // Flag the main display image
        },
    },
    { timestamps: true }
);

const User = model('User', userSchema);

/* ============================
   3. Category Schema & Model
   ============================ */
const categorySchema = new Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        parent: { type: Types.ObjectId, ref: 'Category', default: null },
        description: { type: String },
    },
    { timestamps: true }
);

const Category = model('Category', categorySchema);

/* ============================
   4. Review Schema & Model
   ============================ */
const reviewSchema = new Schema(
    {
        user: { type: Types.ObjectId, ref: 'User', required: true },
        product: { type: Types.ObjectId, ref: 'Product', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
    },
    { timestamps: true }
);

const Review = model('Review', reviewSchema);

/* ============================
   5. Product Schema & Model
   ============================ */
const productSchema = new Schema(
    {
        seller: { type: Types.ObjectId, ref: 'User', required: true }, // The user who is selling this product
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        description: { type: String, required: true },
        brand: { type: String },
        // Array of category references (many-to-many)
        categories: [{ type: Types.ObjectId, ref: 'Category' }],
        price: { type: Number, required: true, min: 0 },
        countInStock: { type: Number, required: true, min: 0, default: 0 },
        rating: { type: Number, default: 0 },
        numReviews: { type: Number, default: 0 },
        // Images stored on GCP: store the full public URL or GCS path
        images: [
            {
                url: { type: String, required: true },               // e.g., https://storage.googleapis.com/my-bucket/image.jpg
                gcpStoragePath: { type: String, required: true },     // e.g., my-bucket/images/product1234.jpg
                altText: { type: String },                            // For accessibility/SEO
                isPrimary: { type: Boolean, default: false },         // Flag the main display image
            },
        ],
        // Optional fields for Amazon-like variants
        variants: [
            {
                sku: { type: String, trim: true },
                price: { type: Number, min: 0 },
                countInStock: { type: Number, min: 0 },
                attributes: { type: Map, of: String }, // e.g., { color: 'red', size: 'M' }
            },
        ],
        // Specifications and bullet points (e.g., for product detail)
        features: [{ type: String }],
        specifications: [{ key: String, value: String }],
        // For “Deal of the Day” or similar promotions
        isFeatured: { type: Boolean, default: false },
        featuredUntil: { type: Date },
    },
    { timestamps: true }
);

const Product = model('Product', productSchema);

/* ============================
   6. Cart Schema & Model
   ============================ */
const cartItemSchema = new Schema(
    {
        product: { type: Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        // Snapshot price at the time item was added
        priceAtAddition: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const cartSchema = new Schema(
    {
        user: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
        items: [cartItemSchema],
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

const Cart = model('Cart', cartSchema);

/* ============================
   7. Order Schema & Model
   ============================ */
const orderItemSchema = new Schema(
    {
        product: { type: Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        qty: { type: Number, required: true, min: 1 },
        image: { type: String, required: true }, // URL snapshot at time of order
        price: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const paymentResultSchema = new Schema(
    {
        paymentId: { type: String },
        status: { type: String },
        updateTime: { type: String },
        emailAddress: { type: String },
    },
    { _id: false }
);

const shippingAddressSchema = new Schema(
    {
        fullName: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        phoneNumber: { type: String, required: true },
    },
    { _id: false }
);

const orderSchema = new Schema(
    {
        user: { type: Types.ObjectId, ref: 'User', required: true },
        orderItems: [orderItemSchema],
        shippingAddress: shippingAddressSchema,
        paymentMethod: { type: String, required: true }, // e.g., 'Stripe', 'PayPal', 'Razorpay'
        paymentResult: paymentResultSchema,
        itemsPrice: { type: Number, required: true, min: 0 },
        taxPrice: { type: Number, required: true, min: 0 },
        shippingPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
        isPaid: { type: Boolean, default: false },
        paidAt: { type: Date },
        isDelivered: { type: Boolean, default: false },
        deliveredAt: { type: Date },
        status: {
            type: String,
            enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

const Order = model('Order', orderSchema);

/* ============================
   8. Wishlist Schema & Model
   ============================ */
const wishlistItemSchema = new Schema(
    {
        product: { type: Types.ObjectId, ref: 'Product', required: true },
        addedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const wishlistSchema = new Schema(
    {
        user: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
        items: [wishlistItemSchema],
    },
    { timestamps: true }
);

const Wishlist = model('Wishlist', wishlistSchema);

/* ============================
   9. Payment Method Schema & Model
      (Optional: if tokenizing payment methods)
   ============================ */
const paymentMethodSchema = new Schema(
    {
        user: { type: Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['card', 'upi', 'netBanking', 'wallet'], required: true },
        provider: { type: String, required: true }, // e.g., 'Visa', 'MasterCard', 'PayPal'
        token: { type: String, required: true }, // Token returned by payment gateway
        expiresAt: { type: Date },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const PaymentMethod = model('PaymentMethod', paymentMethodSchema);

/* ============================
   10. Notification Schema & Model
       (Optional: for order updates, promotions, etc.)
   ============================ */
const notificationSchema = new Schema(
    {
        user: { type: Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['order', 'promotion', 'system'], required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Notification = model('Notification', notificationSchema);

/* ============================
   11. Review Moderation Schema & Model
       (Optional: track reported reviews)
   ============================ */
const reportedReviewSchema = new Schema(
    {
        review: { type: Types.ObjectId, ref: 'Review', required: true },
        reportedBy: { type: Types.ObjectId, ref: 'User', required: true },
        reason: { type: String, required: true },
        isResolved: { type: Boolean, default: false },
        resolvedAt: { type: Date },
    },
    { timestamps: true }
);

const ReportedReview = model('ReportedReview', reportedReviewSchema);

const savedSearchSchema = new Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    keyword: { type: String, trim: true },
    filters: {
      category: { type: mongoose.Types.ObjectId, ref: 'Category' },
      minPrice: { type: Number },
      maxPrice: { type: Number },
      minRating: { type: Number, min: 1, max: 5 },
      inStock: { type: Boolean },
    },
  },
  { timestamps: true }
);

const priceAlertSchema = new Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
    targetPrice: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    lastNotifiedAt: { type: Date }, // optional: track when user was last notified
  },
  { timestamps: true }
);

const SavedSearch = mongoose.model('SavedSearch', savedSearchSchema);
const PriceAlert = mongoose.model('PriceAlert', priceAlertSchema);

const chatMessageSchema = new Schema(
  {
    sender: { type: Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const ChatMessage = model('ChatMessage', chatMessageSchema);

const ticketMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },       // Who opened the ticket
    type: { type: String, enum: ['complaint', 'dispute'], required: true },
    relatedOrder: { type: mongoose.Types.ObjectId, ref: 'Order' },             // e.g., disputing an order
    relatedProduct: { type: mongoose.Types.ObjectId, ref: 'Product' },         // e.g., complaint about a product
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    messages: [ticketMessageSchema],  // Conversation between user and admin
    assignedTo: { type: mongoose.Types.ObjectId, ref: 'User' }, // Admin handling the ticket
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

const auctionBidSchema = new mongoose.Schema(
  {
    bidder: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const auctionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
    seller: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    startPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    bids: [auctionBidSchema],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'ended', 'cancelled'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

const Auction = model('Auction', auctionSchema);


/* ============================
   12. Connect and Export All Models
   ============================ */
// (Assuming connection is established elsewhere — e.g., in app.js)
export {
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
};
