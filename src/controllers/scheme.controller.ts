import { schemeRepository } from "../repository";
import { Request, Response } from "express";
import { FileService } from "../services/file.service";

class SchemeController {
  constructor(){

  }
  // async createScheme(req: Request, res: Response) {
  //   try {
  //     const result = await schemeRepository.createScheme(req.body);
  //     return res.status(201).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error.message);
  //   }
  //}

  async getSchemes(req:any, res: Response) {
    try {
      const fileService = new FileService()
  
      const result = await schemeRepository.getSchemes(1);
      await Promise.all(result.map(async (scheme: any) => {
      scheme.schemeResourcee = await fileService.generateSignedUrl(scheme.schemeResourcee)
      scheme.schemePreview = scheme?.schemePreview ? await fileService.generateSignedUrl(scheme?.schemePreview) : null
    }));
      return res.status(200).json(result);
    } catch (error) {
      console.log(error)
      return res.status(500).json(error.message);
    }
  }

  // async updateScheme(req: Request, res: Response) {
  //   try {
  //     const schemeId = req.params.id;
  //     const result = await schemeRepository.updateScheme(schemeId, req.body);
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error.message);
  //   }
  // }

  // async deleteScheme(req: Request, res: Response) {
  //   try {
  //     const schemeId = req.params.id;
  //     const result = await schemeRepository.deleteScheme(schemeId);
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error.message);
  //   }
  // }

  // async getSchemeEarnings(req: Request, res: Response) {
  //   try {
  //     const result = await schemeRepository.getSchemeEarnings(req.body);
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error.message);
  //   }
  // }
}


export default SchemeController;