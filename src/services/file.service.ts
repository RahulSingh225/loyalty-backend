import { S3 } from "aws-sdk";
import { randomUUID } from "crypto";

import stream, { Readable } from "stream";
import path from "path";

export class FileService {
  private readonly s3: S3 = new S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  });
  private readonly bucketName = process.env.AWS_BUCKET;

  async upload(fileBuffer: Buffer, filePath: string) {
    const params = {
      Bucket: this.bucketName,
      Key: filePath,
      Body: fileBuffer,
      ContentDisposition: "inline",
    };

    try {
      await this.s3.upload(params).promise();
      return true;
    } catch (error) {
      console.error("Error uploading file:", error);
      return false;
    }
  }

  generateFilePath(filename: string, tag: string) {
    let filePath = "";
    switch (tag) {
      case "SELFIE":
        filePath = `csimg/appImages/Profile/${randomUUID()}${path.extname(
          filename
        )}`;
        break;
      case "CLAIMS":
        filePath = `RANJIT/PRODUCT_CATALOG/${filename}`;
        break;
      default:
        break;
    }
    return filePath;
  }

  async generateSignedUrl(filePath: string) {
    try {
      
      const params = {
        Bucket: this.bucketName,
        Key: filePath,
        Expires: 15 * 60,
        ResponseContentDisposition: "inline", // URL expiration time in seconds
      };

      const signedUrl = this.s3.getSignedUrl("getObject", params);

      return signedUrl;
    } catch (error) {
      console.error("Error generating signed URL:", error);
      return null;
    }
  }
}
