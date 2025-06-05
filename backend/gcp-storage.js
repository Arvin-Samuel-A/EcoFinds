import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import path from 'path';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Function to upload file to GCP bucket
const uploadToGCP = async (file, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const fileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      public: true, // Make file publicly accessible
    });

    blobStream.on('error', (error) => {
      reject(error);
    });

    blobStream.on('finish', () => {
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      resolve({
        url: publicUrl,
        gcpStoragePath: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });
    });

    blobStream.end(file.buffer);
  });
};

// Function to delete file from GCP bucket
const deleteFromGCP = async (gcpStoragePath) => {
  try {
    await bucket.file(gcpStoragePath).delete();
    return true;
  } catch (error) {
    console.error('Error deleting file from GCP:', error);
    return false;
  }
};

export { upload, uploadToGCP, deleteFromGCP };