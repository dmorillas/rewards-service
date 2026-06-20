import {Router} from "express";
import { container } from "tsyringe";
import { RewardsController } from "../controllers/rewards.controller";
import {validateId, validateReward, validateRewardUpdate} from "../middlewares/validation";

const router = Router();
const controller = container.resolve(RewardsController);

router.get("/api/v1/rewards", controller.getRewards);
router.post("/api/v1/rewards", validateReward, controller.createReward);
router.get("/api/v1/rewards/:id", validateId, controller.getReward);
router.patch("/api/v1/rewards/:id", validateId, validateRewardUpdate, controller.updateReward);
router.delete("/api/v1/rewards/:id", validateId, controller.deleteReward);

export default router;
