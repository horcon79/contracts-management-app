import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

export const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-notifications', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const expirationQueue = new Queue('expiration-checks', {
    connection,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    },
});
