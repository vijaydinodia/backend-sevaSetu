const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dbpgojr4m",
  api_key: "763362257473318",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadImages = async (files) => {
  const fileArray = Array.isArray(files) ? files : Object.values(files);
  const uploadedImages = [];

  for (const file of fileArray) {
    try {
      // Allow only image files
      if (!file.mimetype.startsWith("image/")) {
        throw new Error("Only image files are allowed");
      }

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "seva-setu/images",
              resource_type: "image",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          )
          .end(file.buffer || file.data);
      });

      uploadedImages.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    } catch (error) {
      console.error("Image upload failed:", error.message);
    }
  }

  return uploadedImages;
};
