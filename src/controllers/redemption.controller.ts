import { redemptionRepository } from "../repository";
import { Request, Response } from "express";
import { FileService } from "../services/file.service";

class RedemptionController {
  async createRedemption(req: Request, res: Response) {
    try {
      const result = await redemptionRepository.initiateRedemption(req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.log(error)
      return res.status(500).json(error.message);
    }
  }

  async getRedemptions(req:any, res: Response) {
    try {
      
      const userId = req.user.userId;
      const result = await redemptionRepository.getRedemptions(userId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  async updateRedemption(req: Request, res: Response) {
    try {
      const redemptionId = req.params.id;
      const result = await redemptionRepository.updateRedemption(
        redemptionId,
        req.body
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  // async deleteRedemption(req: Request, res: Response) {
  //   try {
  //     const redemptionId = req.params.id;
  //     const result = await redemptionRepository.deleteRedemption(redemptionId);
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error.message);
  //   }
  // }

  async getRedemptionDetails(req: Request, res: Response) {
    try {
      const redemptionId = req.params.id;
      const result = await redemptionRepository.getRedemptionDetails(
        redemptionId
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
  async showRewards(req: Request, res: Response) {
    try {

       const fileService = new FileService()
      const result = await redemptionRepository.showRewards();
   
      const output =  result.map(record => ({
    id: record.giftId,
    title: record.giftName,
    image: record.imageUrl,
    points: record.value
  }));

      await Promise.all(output.map(async (reward: any) => {
        reward.image = await fileService.generateSignedUrl(reward.image)
      }));

      return res.status(200).json(output);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
}

export default RedemptionController;
