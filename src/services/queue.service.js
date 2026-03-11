const prisma = require("@/libs/prisma");
const { QUEUE_STATUS } = require("@/config/constants");

class QueueService {
    async push({ type, payload }) {
        await prisma.queue.create({
            data: {
                type,
                payload: JSON.stringify(payload),
                status: QUEUE_STATUS.PENDING,
            },
        });
    }
}

module.exports = new QueueService();
