import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { nanoid } from 'nanoid';

@injectable()
export class IdGeneratorService {
    generateId(): string {
        return nanoid();
    }
}