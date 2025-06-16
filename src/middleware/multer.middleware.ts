import multer, { Multer, StorageEngine } from "multer";

export class MulterMiddleware {
  upload: Multer;
  storage: StorageEngine;
  constructor() {
    this.storage = multer.memoryStorage();
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    });
  }
}
