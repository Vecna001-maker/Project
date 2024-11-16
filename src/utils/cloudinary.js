import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({
    path:'./.env'
})

// Cloudinary configuration using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // Ensure file path is provided

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });

    console.log('Upload successful:', response.secure_url);

    // Asynchronously delete the local file after successful upload
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${localFilePath}`, err);
      }
    });

    return response; // Return the Cloudinary response

  } catch (error) {
    // Asynchronously delete the local file if the upload fails
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${localFilePath}`, err);
      }
    });

    console.error('Unable to upload the file:', error);
    return null; // Return null in case of failure
  }
};

// Export the upload function
export { uploadOnCloudinary };
