import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/errors';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof HttpError) {
        res.status(err.status).json({ message: err.message });
        return;
    }

    res.status(500).json({ message: 'Internal Server Error', description: err instanceof Error ? err.message : 'Unknown error' });
}