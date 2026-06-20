import { container } from "tsyringe";
import { RewardsRepository } from "../repositories/rewards.repository";
import { RewardsService } from "../services/rewards.service";
import { RewardsController } from "../controllers/rewards.controller";
import { IdGeneratorService } from "../services/id.generator.service";

container.registerSingleton(IdGeneratorService);
container.registerSingleton(RewardsRepository);
container.registerSingleton(RewardsService);
container.registerSingleton(RewardsController);