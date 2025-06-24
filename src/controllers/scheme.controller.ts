import { schemeRepository } from "../repository";
import { Request, Response } from "express";

class SchemeController {
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
      const userId = req.user.userId;
      const result = await schemeRepository.getSchemes(userId);
      return res.status(200).json(result);
    } catch (error) {
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