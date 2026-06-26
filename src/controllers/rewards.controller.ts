import "reflect-metadata";
import {Request, Response} from "express";
import { RewardsService } from "../services/rewards.service";
import {injectable, inject} from "tsyringe";

@injectable()
export class RewardsController {
    constructor(
        @inject(RewardsService) private rewardsService: RewardsService
    ) {}

    getRewards = async (_: Request, res: Response) => {
        const rewards = await this.rewardsService.getRewards();
        res.status(200).json(rewards);
    }

    createReward = async (req: Request, res: Response) => {
        const { name, content, enabled = true } = req.body ?? {};

        const definition = await this.rewardsService.addReward(name.trim(), content, enabled);
        res.status(201).json(definition);
    }

    getReward = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const definition = await this.rewardsService.getReward(id);

        res.status(200).json(definition);
    }

    updateReward = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const { name, content, enabled } = req.body ?? {};

        const definition = await this.rewardsService.updateReward(
            id,
            typeof name === "string" ? name.trim() : undefined,
            content,
            enabled,
        );

        res.status(200).json(definition);
    }

    deleteReward = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await this.rewardsService.deleteReward(id);
        res.status(204).send();
    }

    claimReward = async (req: Request, res: Response) => {
        const rewardId = req.params.id as string;
        const rewards = await this.rewardsService.calculateReward(rewardId);

        res.status(200).json({ rewardId, rewards });
    }
}
