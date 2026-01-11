import { Worker, Job } from 'bullmq';
import { connection } from './queue';
import { EmailService } from './mail';
import Contract from '@/models/Contract';
import Dictionary from '@/models/Dictionary';
import { connectToDatabase } from './mongodb';

export const emailWorker = new Worker(
    'email-notifications',
    async (job: Job) => {
        const { contractId, type } = job.data;
        await connectToDatabase();

        const contract = await Contract.findById(contractId);
        if (!contract) {
            console.error(`Contract ${contractId} not found for job ${job.id}`);
            return;
        }

        const responsiblePersonName = contract.metadata.responsiblePerson;
        if (!responsiblePersonName) return;

        // Find the email of the responsible person in dictionaries
        const person = await Dictionary.findOne({
            type: 'persons',
            name: responsiblePersonName,
            isActive: true
        });

        const email = person?.metadata?.email;
        if (!email) {
            console.log(`No email found for responsible person: ${responsiblePersonName}`);
            return;
        }

        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const contractUrl = `${appUrl}/contracts/${contractId}`;

        if (type === 'new_contract') {
            await EmailService.sendMail({
                to: email,
                subject: `Nowa umowa dodana: ${contract.title}`,
                html: `
                    <h1>Nowa umowa w systemie</h1>
                    <p>Została dodana nowa umowa, za którą jesteś osobą odpowiedzialną.</p>
                    <p><strong>Tytuł:</strong> ${contract.title}</p>
                    <p><strong>Klient:</strong> ${contract.metadata.client || 'Nie określono'}</p>
                    <hr />
                    <h3>Podsumowanie AI:</h3>
                    <p>${contract.aiSummary || 'Brak podsumowania'}</p>
                    <hr />
                    <p><a href="${contractUrl}" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Zobacz umowę w aplikacji</a></p>
                `,
                text: `Nowa umowa: ${contract.title}\nKlient: ${contract.metadata.client}\nPodsumowanie AI: ${contract.aiSummary}\nLink: ${contractUrl}`
            });
        }
    },
    { connection }
);

export const expirationWorker = new Worker(
    'expiration-checks',
    async (job: Job) => {
        await connectToDatabase();

        // Find contracts expiring in less than 30 days
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringContracts = await Contract.find({
            'metadata.endDate': {
                $exists: true,
                $ne: null,
                $lte: thirtyDaysFromNow.toISOString(),
                $gt: new Date().toISOString()
            }
        });

        if (expiringContracts.length === 0) return;

        // Group by person to send combined email? 
        // User asked: "wysyłaj maila do osób odpowiedzialnych z treścią o kończącej się umowie oraz linkiem do tej umowy"
        // If a person has multiple expiring contracts, maybe better to send one email?
        // For simplicity, let's start with one per contract or group them.

        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        for (const contract of expiringContracts) {
            const responsiblePersonName = contract.metadata.responsiblePerson;
            if (!responsiblePersonName) continue;

            const person = await Dictionary.findOne({
                type: 'persons',
                name: responsiblePersonName,
                isActive: true
            });

            const email = person?.metadata?.email;
            if (!email) continue;

            const contractUrl = `${appUrl}/contracts/${contract._id}`;

            await EmailService.sendMail({
                to: email,
                subject: `PRZYPOMNIENIE: Umowa wygasa wkrótce: ${contract.title}`,
                html: `
                    <h1>Przypomnienie o wygasającej umowie</h1>
                    <p>Poniższa umowa wygasa w ciągu najbliższych 30 dni.</p>
                    <p><strong>Tytuł:</strong> ${contract.title}</p>
                    <p><strong>Data zakończenia:</strong> ${contract.metadata.endDate}</p>
                    <p><strong>Klient:</strong> ${contract.metadata.client || 'Nie określono'}</p>
                    <hr />
                    <p><a href="${contractUrl}" style="padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px;">Zobacz szczegóły umowy</a></p>
                `,
                text: `Umowa wygasa wkrótce: ${contract.title}\nData zakończenia: ${contract.metadata.endDate}\nLink: ${contractUrl}`
            });
        }
    },
    { connection }
);
