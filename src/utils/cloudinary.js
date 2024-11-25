import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
import { ApiError } from './ApiError.js';

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


//we get url has https://res.cloudinary.com/dbfiawivy/image/upload/v1731851653/ggcw2ejyspfhniqocymz.jpg
//this is ggcw2ejyspfhniqocymz publicId , we need this to destrop image , so extracting it
const extractPublicId = (url) => {
  const parts = url.split('/');
  const publicIdWithExtension = parts[parts.length - 1]; // "ggcw2ejyspfhniqocymz.jpg"
  const publicId = publicIdWithExtension.split('.')[0]; // Remove ".jpg"
  return publicId;
};

const deleteFromCloudinary = async (url) => {
  try {
      const publicId = extractPublicId(url); // Extract public_id
      const response = await cloudinary.uploader.destroy(publicId);
      console.log('Deletion successful:', response);
      return response;
  } catch (error) {
      console.error('Error deleting the file from Cloudinary:', error.message);
      return null;
  }
};


// Export the upload function
export { uploadOnCloudinary ,deleteFromCloudinary};
