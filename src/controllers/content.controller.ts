import {Request,Response,NextFunction} from 'express';
import { FileService } from '../services/file.service';
import ContentRepository from '../repository/content.repository';

export default class ContentController {
  // This class will handle the content-related operations.
  // It will use the ContentRepository to interact with the database.
  
  constructor(private contentRepository: ContentRepository,private fileService:FileService) {
    
  }

  async listContents(req:Request,res:Response): Promise<any> {

    try {
    const { type } = req.params;
    const result =  await this.contentRepository.listContents(type);
    await Promise.all(result.map(async (content: any) => {
      content.imagePdfUrl = await this.fileService.generateSignedUrl(`RANJIT/${content.contentType}/${content.imagePdfUrl}`)
    }));
    return res.status(200).json(result);
} catch (error) {
      console.error('Error listing contents:', error);
      return res.status(500).json({ message: 'Internal server error', error });
    }
  }

  async saveContent(id: string, content: string): Promise<void> {
    await this.contentRepository.saveContent(id, content);
  }

  // Additional methods for content management can be added here.
}