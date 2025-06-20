import { earningRepository } from "../repository";

class EarningController {
  async initiateEarning(req: Request, res: Response) {
    try {
      const result = await earningRepository.initiateEarning(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  async getEarnings(req, res: Response) {
    try {
      const userId = req.user.userId;
      const result = await earningRepository.getEarnings(userId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }

  async calculateEarnings(req, res: Response) {
    try {
      const userId = req.user.userId;
      const result = await earningRepository.calculateEarnings(userId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
}

export default EarningController;
