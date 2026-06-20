import { body, param, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { type RewardDefinitionContent, RewardType } from "../domain/reward";

function handleValidation(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
}

const nameRule = body("name")
  .exists({ checkNull: true })
  .withMessage("'name' is required")
  .bail()
  .isString()
  .withMessage("'name' must be a string")
  .bail()
  .trim()
  .notEmpty()
  .withMessage("'name' cannot be empty");

const contentRule = body("content")
  .exists({ checkNull: true })
  .withMessage("'content' is required")
  .bail()
  .custom(isRewardDefinitionContent)
  .withMessage("'content' must be a valid reward content array");

const enabledRule = body("enabled")
  .optional()
  .isBoolean()
  .withMessage("'enabled' must be a boolean");

export const validateReward = [nameRule, contentRule, enabledRule, handleValidation];

export const validateRewardUpdate = [
  body("name")
    .optional()
    .isString()
    .withMessage("'name' must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("'name' cannot be empty"),
  body("content").optional().custom(isRewardDefinitionContent),
  body("enabled").optional().isBoolean().withMessage("'enabled' must be a boolean"),
  handleValidation,
];

const rewardEntrySchema = z.object({
  resource: z.enum(RewardType),
});

const rewardContentSchema = z.array(
  z.object({
    type: z.enum(["fixed", "random"]),
    rewards: z.array(rewardEntrySchema),
  }),
);

export function isRewardDefinitionContent(value: unknown): value is RewardDefinitionContent[] {
  return rewardContentSchema.safeParse(value).success;
}

export const validateId = [
  param("id")
    .exists({ checkNull: true })
    .withMessage("ID is required")
    .bail()
    .isString()
    .withMessage("ID must be a string")
    .bail()
    .isLength({ min: 1, max: 100 })
    .withMessage("ID must be between 1 and 100 characters")
    .bail()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("ID contains invalid characters"),
  handleValidation,
];
