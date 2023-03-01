const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY,
  region: "ap-south-1",
});
const s3 = new AWS.S3();
const BucketName = process.env.BUCKET_NAME;
// const s3 = njnkew AWS.S3({accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,region:"ap-south-1"})
// const BucketName = process.env.BUCKET_NAME || 'aaruush22-bucket'
// const sharp = require("sharp");
const crypto = require("crypto");

const uploadImage = (image, imageName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const allowedExt = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
      if (!image) {
        return reject({ statusCode: 422, message: "No Image!" });
      }

      const mimetype = image.split(";")[0].split(":")[1];

      if (!allowedExt.includes(mimetype)) {
        return reject({ statusCode: 415, message: "File Type Not Supported!" });
      }

      // image data as base64
      const image_data_as_base64 = image.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

      // // image buffer
      const decoded_image = Buffer.from(image_data_as_base64, "base64");

      // // optimized image buffer converted to webp
      // const optimized_image = await sharp(decoded_image).webp().toBuffer();
      const optimized_image = decoded_image;
      const id = crypto.randomBytes(4).toString("hex");
      const name = imageName.split(".")[0];
      const image_name = `${name}-${id}.png`;
      const upload = await s3
        .upload({
          Bucket: BucketName,
          Body: optimized_image,
          Key: image_name,
          ContentType: "image/png",
          ACL: "public-read",
        })
        .promise();
      return resolve(upload.Location);
    } catch (error) {
      console.log(error);
      return reject({ statusCode: 400, message: error });
    }
  });
};

const deleteImage = (key) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Bucket: BucketName,
        Key: key,
      };
      const remove = await s3.deleteObject(params).promise();
      if (!remove) {
        throw new Error("Error");
      }
      return resolve("Image Deleted Successfully!!");
    } catch (error) {
      return reject(Error("Error Deleting Image!!"));
    }
  });
};

module.exports = { uploadImage, deleteImage };
