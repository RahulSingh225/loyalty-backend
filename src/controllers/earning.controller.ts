import { earningRepository } from "../repository";
import {Request, Response} from "express";
class EarningController {
  async initiateEarning(req: Request, res: Response) {
    try {
      const result = await earningRepository.pointsTransfer(req.body,req.user);
      return res.status(201).json({success:true,data:result});
    } catch (error) {
      console.log(error);
      return res.status(500).json({success:false,message:error.message});
    }
  }

  async getTransferHistory(req:any, res: Response) {
    try {
      const userId = req.user.userId;
      const result = await earningRepository.pointTransferHistory(req.user);
      return res.status(200).json({success:true,data:result});
    } catch (error) {
      console.log(error);
      return res.status(500).json({success:false,message:error.message});
    }
  }
  // async getEarnings(req, res: Response) {
  //   try {
  //     const userId = req.user.userId;
  //     const result = await earningRepository.getEarnings(userId);
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error.message);
  //   }
  // }

  // async calculateEarnings(req, res: Response) {
  //   try {
  //     const userId = req.user.userId;
  //     const result = await earningRepository.calculateEarnings(userId);
  //     return res.status(200).json(result);
  //   } catch (error) {
  //     return res.status(500).json(error.message);
  //   }
  // }
}

export default EarningController;
