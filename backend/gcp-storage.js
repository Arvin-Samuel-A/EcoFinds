import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug: Log environment variables to check if they're loaded
console.log('GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID);
console.log('GCP_STORAGE_BUCKET_NAME:', process.env.GCP_STORAGE_BUCKET_NAME);
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Validate required environment variables
if (!process.env.GCP_PROJECT_ID) {
    throw new Error('GCP_PROJECT_ID environment variable is required');
}
if (!process.env.GCP_STORAGE_BUCKET_NAME) {
    throw new Error('GCP_STORAGE_BUCKET_NAME environment variable is required');
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is required');
}

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.GCP_STORAGE_BUCKET_NAME);

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
        }
    },
});

// Function to upload file to GCP
const uploadToGCP = async (file, folder = 'uploads') => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${folder}/${timestamp}-${randomString}-${file.originalname}`;

        // Create a reference to the file in the bucket
        const fileUpload = bucket.file(fileName);

        // Create a stream to upload the file
        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
                cacheControl: 'public, max-age=31536000', // 1 year cache
            },
            public: true, // Make the file publicly accessible
        });

        return new Promise((resolve, reject) => {
            stream.on('error', (error) => {
                console.error('Upload error:', error);
                reject(error);
            });

            stream.on('finish', async () => {
                try {
                    // Make the file public
                    await fileUpload.makePublic();
                    
                    // Get the public URL
                    const publicUrl = `https://storage.googleapis.com/${process.env.GCP_STORAGE_BUCKET_NAME}/${fileName}`;
                    
                    resolve({
                        url: publicUrl,
                        gcpStoragePath: fileName,
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        size: file.size,
                    });
                } catch (error) {
                    console.error('Error making file public:', error);
                    reject(error);
                }
            });

            // Write the file buffer to the stream
            stream.end(file.buffer);
        });
    } catch (error) {
        console.error('Error in uploadToGCP:', error);
        throw error;
    }
};

// Function to delete file from GCP
const deleteFromGCP = async (gcpStoragePath) => {
    try {
        if (!gcpStoragePath) {
            console.warn('No GCP storage path provided for deletion');
            return;
        }

        const file = bucket.file(gcpStoragePath);
        const [exists] = await file.exists();
        
        if (exists) {
            await file.delete();
            console.log(`File deleted successfully: ${gcpStoragePath}`);
        } else {
            console.warn(`File not found for deletion: ${gcpStoragePath}`);
        }
    } catch (error) {
        console.error('Error deleting file from GCP:', error);
        // Don't throw error for deletion failures to avoid breaking the main flow
    }
};

// Test bucket connection
const testBucketConnection = async () => {
    try {
        const [exists] = await bucket.exists();
        if (exists) {
            console.log('✅ Successfully connected to GCP bucket:', process.env.GCP_STORAGE_BUCKET_NAME);
        } else {
            console.error('❌ GCP bucket does not exist:', process.env.GCP_STORAGE_BUCKET_NAME);
        }
    } catch (error) {
        console.error('❌ Error connecting to GCP bucket:', error.message);
    }
};

// Test connection on module load
testBucketConnection();

export { upload, uploadToGCP, deleteFromGCP, bucket };