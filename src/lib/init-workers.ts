import { emailWorker, expirationWorker } from './worker';
import { expirationQueue } from './queue';

export async function initWorkers() {
    console.log('Initializing background workers...');

    // Workers are initialized by importing them (they start automatically on the connection)
    // We just need to make sure they are NOT garbage collected or pruned if possible

    // Setup weekly expiration check (e.g., every Monday at 9 AM)
    // BullMQ repeat options: '0 9 * * 1' (cron for Mon 9:00)
    await expirationQueue.add(
        'weekly-expiration-check',
        {},
        {
            repeat: {
                pattern: '0 9 * * 1', // Weekly on Monday at 9:00
            }
        }
    );

    console.log('Background workers and cron jobs initialized.');
}
