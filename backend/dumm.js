import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
    User,
    Category,
    Product,
    Auction,
    Review,
    Cart,
    Wishlist,
    Order,
    ChatMessage,
    Ticket
} from './orm.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecom';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB for seeding');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Sample Users Data
const sampleUsers = [
    {
        name: 'John Smith',
        email: 'john@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'seller',
        phone: '+91-9876543210',
        isVerified: true,
        addresses: [
            {
                fullName: 'John Smith',
                addressLine1: '123 Green Avenue',
                city: 'Chennai',
                state: 'Tamil Nadu',
                postalCode: '600001',
                country: 'India',
                phoneNumber: '+91-9876543210',
                isDefault: true
            }
        ],
        images: {
            url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
            gcpStoragePath: 'users/john-profile.jpg',
            altText: 'John Smith Profile Picture',
            isPrimary: true
        }
    },
    {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'seller',
        phone: '+91-9876543211',
        isVerified: true,
        addresses: [
            {
                fullName: 'Sarah Johnson',
                addressLine1: '456 Eco Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400001',
                country: 'India',
                phoneNumber: '+91-9876543211',
                isDefault: true
            }
        ],
        images: {
            url: 'https://images.unsplash.com/photo-1494790108755-2616b612b29c?w=400',
            gcpStoragePath: 'users/sarah-profile.jpg',
            altText: 'Sarah Johnson Profile Picture',
            isPrimary: true
        }
    },
    {
        name: 'Mike Chen',
        email: 'mike@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'buyer',
        phone: '+91-9876543212',
        isVerified: true,
        addresses: [
            {
                fullName: 'Mike Chen',
                addressLine1: '789 Tech Park',
                city: 'Bangalore',
                state: 'Karnataka',
                postalCode: '560001',
                country: 'India',
                phoneNumber: '+91-9876543212',
                isDefault: true
            }
        ],
        images: {
            url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
            gcpStoragePath: 'users/mike-profile.jpg',
            altText: 'Mike Chen Profile Picture',
            isPrimary: true
        }
    },
    {
        name: 'Admin User',
        email: 'admin@ecofinds.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        phone: '+91-9876543213',
        isVerified: true,
        addresses: [
            {
                fullName: 'Admin User',
                addressLine1: 'EcoFinds HQ',
                city: 'Delhi',
                state: 'Delhi',
                postalCode: '110001',
                country: 'India',
                phoneNumber: '+91-9876543213',
                isDefault: true
            }
        ]
    }
];

// Sample Categories Data
const sampleCategories = [
    {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Phones, laptops, gadgets and electronic accessories'
    },
    {
        name: 'Fashion & Clothing',
        slug: 'fashion',
        description: 'Clothes, shoes, bags and fashion accessories'
    },
    {
        name: 'Furniture & Home',
        slug: 'furniture',
        description: 'Furniture, home decor and household items'
    },
    {
        name: 'Books & Media',
        slug: 'books',
        description: 'Books, magazines, CDs, DVDs and educational materials'
    },
    {
        name: 'Sports & Outdoors',
        slug: 'sports',
        description: 'Sports equipment, outdoor gear and fitness items'
    },
    {
        name: 'Toys & Games',
        slug: 'toys',
        description: 'Toys, board games, puzzles and entertainment items'
    },
    {
        name: 'Automotive',
        slug: 'automotive',
        description: 'Car accessories, parts and automotive tools'
    },
    {
        name: 'Collectibles & Art',
        slug: 'collectibles',
        description: 'Antiques, art pieces, collectibles and vintage items'
    }
];

// Function to create sample products
const createSampleProducts = (users, categories) => [
    {
        seller: users[0]._id, // John Smith
        name: 'iPhone 12 Pro - Excellent Condition',
        slug: 'iphone-12-pro-excellent-condition',
        description: 'Barely used iPhone 12 Pro in excellent condition. All original accessories included. No scratches or dents. Battery health at 95%. Perfect for someone looking for a premium phone at a great price.',
        brand: 'Apple',
        categories: [categories[0]._id], // Electronics
        price: 45000,
        countInStock: 1,
        rating: 4.8,
        numReviews: 3,
        images: [
            {
                url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
                gcpStoragePath: 'products/iphone-12-pro-1.jpg',
                altText: 'iPhone 12 Pro Front View',
                isPrimary: true
            },
            {
                url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500',
                gcpStoragePath: 'products/iphone-12-pro-2.jpg',
                altText: 'iPhone 12 Pro Back View',
                isPrimary: false
            }
        ],
        features: [
            'Condition: Excellent',
            'Battery Health: 95%',
            'All original accessories included',
            'No physical damage',
            'Unlocked to all networks'
        ],
        specifications: [
            { key: 'Storage', value: '128GB' },
            { key: 'Color', value: 'Space Gray' },
            { key: 'RAM', value: '6GB' },
            { key: 'Display', value: '6.1 inch Super Retina XDR' }
        ],
        isFeatured: true,
        featuredUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    {
        seller: users[1]._id, // Sarah Johnson
        name: 'Vintage Leather Jacket - Designer',
        slug: 'vintage-leather-jacket-designer',
        description: 'Beautiful vintage leather jacket from a premium designer brand. Timeless style that never goes out of fashion. Well-maintained with minimal wear. Perfect for fashion enthusiasts who appreciate quality vintage pieces.',
        brand: 'Zara',
        categories: [categories[1]._id], // Fashion
        price: 3500,
        countInStock: 1,
        rating: 4.5,
        numReviews: 2,
        images: [
            {
                url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
                gcpStoragePath: 'products/leather-jacket-1.jpg',
                altText: 'Vintage Leather Jacket Front',
                isPrimary: true
            }
        ],
        features: [
            'Condition: Good',
            'Size: Medium',
            'Genuine leather',
            'Designer brand',
            'Vintage style'
        ],
        specifications: [
            { key: 'Size', value: 'Medium' },
            { key: 'Material', value: 'Genuine Leather' },
            { key: 'Color', value: 'Black' },
            { key: 'Brand', value: 'Zara' }
        ]
    },
    {
        seller: users[0]._id, // John Smith
        name: 'MacBook Air M1 2020 - Like New',
        slug: 'macbook-air-m1-2020-like-new',
        description: 'MacBook Air with M1 chip in like-new condition. Purchased 6 months ago, barely used due to work-from-home setup change. Comes with original charger and packaging. Perfect for students or professionals.',
        brand: 'Apple',
        categories: [categories[0]._id], // Electronics
        price: 75000,
        countInStock: 1,
        rating: 5.0,
        numReviews: 1,
        images: [
            {
                url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500',
                gcpStoragePath: 'products/macbook-air-1.jpg',
                altText: 'MacBook Air M1 2020',
                isPrimary: true
            }
        ],
        features: [
            'Condition: Like New',
            'M1 Chip with 8-core CPU',
            '8GB Unified Memory',
            '256GB SSD Storage',
            'Original packaging included'
        ],
        specifications: [
            { key: 'Processor', value: 'Apple M1 Chip' },
            { key: 'Memory', value: '8GB' },
            { key: 'Storage', value: '256GB SSD' },
            { key: 'Display', value: '13.3-inch Retina' }
        ],
        isFeatured: true
    },
    {
        seller: users[1]._id, // Sarah Johnson
        name: 'Wooden Coffee Table - Handcrafted',
        slug: 'wooden-coffee-table-handcrafted',
        description: 'Beautiful handcrafted wooden coffee table made from reclaimed teak wood. Unique grain patterns and eco-friendly finish. Perfect centerpiece for any living room. Moving sale - need to sell quickly.',
        categories: [categories[2]._id], // Furniture
        price: 8500,
        countInStock: 1,
        rating: 4.7,
        numReviews: 4,
        images: [
            {
                url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
                gcpStoragePath: 'products/coffee-table-1.jpg',
                altText: 'Wooden Coffee Table',
                isPrimary: true
            }
        ],
        features: [
            'Condition: Excellent',
            'Material: Reclaimed Teak Wood',
            'Handcrafted design',
            'Eco-friendly finish',
            'Dimensions: 120cm x 60cm x 45cm'
        ],
        specifications: [
            { key: 'Material', value: 'Teak Wood' },
            { key: 'Dimensions', value: '120 x 60 x 45 cm' },
            { key: 'Weight', value: '25 kg' },
            { key: 'Finish', value: 'Natural Wood Finish' }
        ]
    },
    {
        seller: users[0]._id, // John Smith
        name: 'Complete Harry Potter Book Set',
        slug: 'complete-harry-potter-book-set',
        description: 'Complete set of Harry Potter books in excellent condition. All 7 books included with minimal wear. Perfect for collectors or fans who want to own the complete series. Great investment for book lovers.',
        categories: [categories[3]._id], // Books
        price: 2500,
        countInStock: 1,
        rating: 4.9,
        numReviews: 5,
        images: [
            {
                url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
                gcpStoragePath: 'products/harry-potter-books-1.jpg',
                altText: 'Harry Potter Book Set',
                isPrimary: true
            }
        ],
        features: [
            'Condition: Excellent',
            'Complete 7-book series',
            'Original paperback editions',
            'Minimal wear and tear',
            'Perfect for collectors'
        ],
        specifications: [
            { key: 'Books Included', value: '7 Books' },
            { key: 'Edition', value: 'Paperback' },
            { key: 'Language', value: 'English' },
            { key: 'Publisher', value: 'Bloomsbury' }
        ]
    },
    {
        seller: users[1]._id, // Sarah Johnson
        name: 'Professional Camera Lens - 50mm',
        slug: 'professional-camera-lens-50mm',
        description: 'Professional 50mm camera lens in excellent condition. Perfect for portrait photography. Barely used, comes with lens cap and UV filter. Great opportunity for photography enthusiasts to get professional equipment at a fraction of retail price.',
        brand: 'Canon',
        categories: [categories[0]._id], // Electronics
        price: 12000,
        countInStock: 1,
        rating: 4.6,
        numReviews: 2,
        images: [
            {
                url: 'https://images.unsplash.com/photo-1606983340234-23dd3775c50b?w=500',
                gcpStoragePath: 'products/camera-lens-1.jpg',
                altText: 'Canon 50mm Lens',
                isPrimary: true
            }
        ],
        features: [
            'Condition: Excellent',
            'Focal Length: 50mm',
            'Professional grade',
            'Includes UV filter',
            'Perfect for portraits'
        ],
        specifications: [
            { key: 'Focal Length', value: '50mm' },
            { key: 'Aperture', value: 'f/1.8' },
            { key: 'Mount', value: 'Canon EF' },
            { key: 'Weight', value: '160g' }
        ]
    }
];

// Function to create sample auctions
const createSampleAuctions = (users) => [
    {
        title: 'Vintage Rolex Watch - Collector\'s Item',
        description: 'Rare vintage Rolex watch from the 1980s. Excellent condition with original papers and box. This is a genuine collector\'s piece with proven authenticity. Perfect investment for watch collectors.',
        startingBid: 50000,
        currentBid: 50000,
        reservePrice: 75000,
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        category: 'collectibles',
        condition: 'excellent',
        images: [
            {
                url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                gcpStoragePath: 'auctions/rolex-watch-1.jpg',
                altText: 'Vintage Rolex Watch',
                isPrimary: true
            }
        ],
        seller: users[0]._id, // John Smith
        bids: [
            {
                bidder: users[2]._id, // Mike Chen
                amount: 52000,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            }
        ],
        status: 'active'
    },
    {
        title: 'Antique Wooden Chess Set',
        description: 'Beautiful handcrafted wooden chess set with intricate carvings. Each piece is individually carved from premium rosewood. Comes with original wooden storage box. Perfect for chess enthusiasts and collectors.',
        startingBid: 2000,
        currentBid: 2500,
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        category: 'collectibles',
        condition: 'good',
        images: [
            {
                url: 'https://images.unsplash.com/photo-1528618043841-b2a034ffccbd?w=500',
                gcpStoragePath: 'auctions/chess-set-1.jpg',
                altText: 'Antique Wooden Chess Set',
                isPrimary: true
            }
        ],
        seller: users[1]._id, // Sarah Johnson
        bids: [
            {
                bidder: users[2]._id, // Mike Chen
                amount: 2200,
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
            },
            {
                bidder: users[0]._id, // John Smith
                amount: 2500,
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
            }
        ],
        status: 'active'
    },
    {
        title: 'Rare Comic Book Collection',
        description: 'Collection of rare Marvel comic books from the 1970s and 1980s. Includes first editions and limited releases. All books are in protective sleeves and excellent condition. Perfect for comic book collectors.',
        startingBid: 5000,
        currentBid: 5000,
        reservePrice: 8000,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        category: 'books',
        condition: 'excellent',
        images: [
            {
                url: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=500',
                gcpStoragePath: 'auctions/comic-books-1.jpg',
                altText: 'Rare Comic Book Collection',
                isPrimary: true
            }
        ],
        seller: users[0]._id, // John Smith
        bids: [],
        status: 'active'
    }
];

// Function to create sample reviews
const createSampleReviews = (users, products) => [
    {
        user: users[2]._id, // Mike Chen
        product: products[0]._id, // iPhone 12 Pro
        rating: 5,
        comment: 'Excellent condition as described! The phone works perfectly and looks almost new. Great seller with fast shipping. Highly recommended!'
    },
    {
        user: users[1]._id, // Sarah Johnson
        product: products[0]._id, // iPhone 12 Pro
        rating: 4,
        comment: 'Good deal for the price. Phone is in great condition with minor signs of use. Seller was very responsive to questions.'
    },
    {
        user: users[2]._id, // Mike Chen
        product: products[1]._id, // Leather Jacket
        rating: 4,
        comment: 'Beautiful vintage jacket! The leather quality is excellent. Fits perfectly as described. Happy with the purchase.'
    },
    {
        user: users[0]._id, // John Smith
        product: products[3]._id, // Coffee Table
        rating: 5,
        comment: 'Absolutely stunning coffee table! The craftsmanship is incredible and it looks amazing in my living room. Worth every penny.'
    },
    {
        user: users[2]._id, // Mike Chen
        product: products[4]._id, // Harry Potter Books
        rating: 5,
        comment: 'Complete set in excellent condition! All books are well-maintained. Perfect for my collection. Fast delivery too!'
    }
];

// Function to create sample cart items
const createSampleCarts = (users, products) => [
    {
        user: users[2]._id, // Mike Chen
        items: [
            {
                product: products[1]._id, // Leather Jacket
                quantity: 1,
                priceAtAddition: products[1].price
            },
            {
                product: products[4]._id, // Harry Potter Books
                quantity: 1,
                priceAtAddition: products[4].price
            }
        ]
    }
];

// Function to create sample wishlists
const createSampleWishlists = (users, products) => [
    {
        user: users[2]._id, // Mike Chen
        items: [
            {
                product: products[0]._id, // iPhone 12 Pro
                addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            },
            {
                product: products[2]._id, // MacBook Air
                addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
            }
        ]
    }
];

// Function to create sample orders
const createSampleOrders = (users, products) => [
    {
        user: users[2]._id, // Mike Chen
        orderItems: [
            {
                product: products[4]._id, // Harry Potter Books
                name: products[4].name,
                qty: 1,
                image: products[4].images[0].url,
                price: products[4].price
            }
        ],
        shippingAddress: {
            fullName: 'Mike Chen',
            addressLine1: '789 Tech Park',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
            phoneNumber: '+91-9876543212'
        },
        paymentMethod: 'Razorpay',
        paymentResult: {
            paymentId: 'pay_1234567890',
            status: 'completed',
            updateTime: new Date().toISOString(),
            emailAddress: 'mike@example.com'
        },
        itemsPrice: products[4].price,
        taxPrice: products[4].price * 0.18, // 18% GST
        shippingPrice: 100,
        totalPrice: products[4].price + (products[4].price * 0.18) + 100,
        isPaid: true,
        paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        isDelivered: false,
        status: 'paid'
    }
];

// Function to create sample chat messages
const createSampleChatMessages = (users) => [
    {
        sender: users[2]._id, // Mike Chen
        receiver: users[0]._id, // John Smith
        content: 'Hi, I\'m interested in the iPhone 12 Pro. Is it still available?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
        sender: users[0]._id, // John Smith
        receiver: users[2]._id, // Mike Chen
        content: 'Yes, it\'s still available! The phone is in excellent condition as described. Would you like to know anything specific about it?',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
    },
    {
        sender: users[2]._id, // Mike Chen
        receiver: users[0]._id, // John Smith
        content: 'Does it come with the original charger and box?',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    },
    {
        sender: users[0]._id, // John Smith
        receiver: users[2]._id, // Mike Chen
        content: 'Yes, it comes with the original charger, box, and all accessories. Everything is included as mentioned in the listing.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    }
];

// Function to create sample support tickets
const createSampleTickets = (users, products) => [
    {
        user: users[2]._id, // Mike Chen
        type: 'complaint',
        relatedProduct: products[0]._id, // iPhone 12 Pro
        subject: 'Product not as described',
        description: 'The iPhone I received has a small scratch on the screen that wasn\'t mentioned in the listing. I would like to discuss a resolution.',
        status: 'open',
        messages: [
            {
                sender: users[2]._id, // Mike Chen
                content: 'I received the iPhone but noticed a small scratch on the screen that wasn\'t mentioned. Can we discuss this?',
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
            }
        ]
    }
];

// Main seeding function
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        await Auction.deleteMany({});
        await Review.deleteMany({});
        await Cart.deleteMany({});
        await Wishlist.deleteMany({});
        await Order.deleteMany({});
        await ChatMessage.deleteMany({});
        await Ticket.deleteMany({});

        console.log('🗑️  Cleared existing data');

        // Create users first (needed for password hashing)
        const hashedUsers = [];
        for (const userData of sampleUsers) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            hashedUsers.push({
                ...userData,
                passwordHash: hashedPassword
            });
        }

        // Insert data in correct order (respecting dependencies)
        const insertedUsers = await User.insertMany(hashedUsers);
        console.log(`👥 Created ${insertedUsers.length} users`);

        const insertedCategories = await Category.insertMany(sampleCategories);
        console.log(`📂 Created ${insertedCategories.length} categories`);

        const sampleProducts = createSampleProducts(insertedUsers, insertedCategories);
        const insertedProducts = await Product.insertMany(sampleProducts);
        console.log(`📦 Created ${insertedProducts.length} products`);

        const sampleAuctions = createSampleAuctions(insertedUsers);
        const insertedAuctions = await Auction.insertMany(sampleAuctions);
        console.log(`🔨 Created ${insertedAuctions.length} auctions`);

        const sampleReviews = createSampleReviews(insertedUsers, insertedProducts);
        const insertedReviews = await Review.insertMany(sampleReviews);
        console.log(`⭐ Created ${insertedReviews.length} reviews`);

        const sampleCarts = createSampleCarts(insertedUsers, insertedProducts);
        const insertedCarts = await Cart.insertMany(sampleCarts);
        console.log(`🛒 Created ${insertedCarts.length} carts`);

        const sampleWishlists = createSampleWishlists(insertedUsers, insertedProducts);
        const insertedWishlists = await Wishlist.insertMany(sampleWishlists);
        console.log(`❤️  Created ${insertedWishlists.length} wishlists`);

        const sampleOrders = createSampleOrders(insertedUsers, insertedProducts);
        const insertedOrders = await Order.insertMany(sampleOrders);
        console.log(`📋 Created ${insertedOrders.length} orders`);

        const sampleChatMessages = createSampleChatMessages(insertedUsers);
        const insertedChatMessages = await ChatMessage.insertMany(sampleChatMessages);
        console.log(`💬 Created ${insertedChatMessages.length} chat messages`);

        const sampleTickets = createSampleTickets(insertedUsers, insertedProducts);
        const insertedTickets = await Ticket.insertMany(sampleTickets);
        console.log(`🎫 Created ${insertedTickets.length} support tickets`);

        console.log('✅ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Users: ${insertedUsers.length}`);
        console.log(`   Categories: ${insertedCategories.length}`);
        console.log(`   Products: ${insertedProducts.length}`);
        console.log(`   Auctions: ${insertedAuctions.length}`);
        console.log(`   Reviews: ${insertedReviews.length}`);
        console.log(`   Carts: ${insertedCarts.length}`);
        console.log(`   Wishlists: ${insertedWishlists.length}`);
        console.log(`   Orders: ${insertedOrders.length}`);
        console.log(`   Chat Messages: ${insertedChatMessages.length}`);
        console.log(`   Support Tickets: ${insertedTickets.length}`);

        console.log('\n🔑 Test User Credentials:');
        console.log('   Seller 1: john@example.com / password123');
        console.log('   Seller 2: sarah@example.com / password123');
        console.log('   Buyer: mike@example.com / password123');
        console.log('   Admin: admin@ecofinds.com / admin123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
};

// Connect and seed
connectDB().then(() => {
    seedDatabase();
});