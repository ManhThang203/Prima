require("module-alias/register");
require("dotenv").config();
const tasks = require("@/tasks");

const sleep = require("@/utils/sleep");

const constants = require("@/config/constants");
const prisma = require("@/libs/prisma");

(async () => {
    while (true) {
        const pendingJobs = await prisma.queue.findFirst({
            where: {
                status: constants.QUEUE_STATUS.PENDING,
            },
        });

        if (pendingJobs) {
            const type = pendingJobs.type;

            const payload = JSON.parse(pendingJobs.payload);
            switch (type) {
                case "sendVerificationEmail":
                    try {
                        console.log(`Job: "${type}" is processing...`);
                        await prisma.queue.update({
                            where: {
                                id: pendingJobs.id,
                            },
                            data: {
                                status: constants.QUEUE_STATUS.PROCESSING,
                            },
                        });
                        // Gửi email xác thực
                        const handler = tasks[type];


                        if (!handler) {
                            throw new Error(`No handler found for job type: ${type}`);
                        }
                        await handler(
                            payload,
                            "Xác thực email của bạn",
                            payload.verifyToken,
                        );

                        await prisma.queue.update({
                            where: {
                                id: pendingJobs.id,
                            },
                            data: {
                                status: constants.QUEUE_STATUS.COMPLETED,
                            },
                        });

                        console.log(`Job: "${type}" is processed!`);
                    } catch (error) {
                        console.error("Error processing job:", error);

                        await prisma.queue.update({
                            where: {
                                id: pendingJobs.id,
                            },
                            data: {
                                status: constants.QUEUE_STATUS.FAILED,
                            },
                        });
                    }
            }
        }
        await sleep(1000);
    }
})();