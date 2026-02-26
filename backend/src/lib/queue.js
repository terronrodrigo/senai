import amqp from 'amqplib';
import { config } from '../config.js';

const QUEUES = {
  projectProcess: 'saga.project.process',
  certificateGenerate: 'saga.certificate.generate',
  emailNotify: 'saga.email.notify',
};

let channel = null;
let connection = null;

export async function getChannel() {
  if (channel) return channel;
  connection = await amqp.connect(config.rabbitmqUrl);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUES.projectProcess, { durable: true });
  await channel.assertQueue(QUEUES.certificateGenerate, { durable: true });
  await channel.assertQueue(QUEUES.emailNotify, { durable: true });
  return channel;
}

export async function publish(queueName, payload) {
  const ch = await getChannel();
  const q = QUEUES[queueName] || queueName;
  ch.sendToQueue(q, Buffer.from(JSON.stringify(payload)), { persistent: true });
}

export async function consume(queueName, handler) {
  const ch = await getChannel();
  const q = QUEUES[queueName] || queueName;
  ch.consume(q, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);
      ch.ack(msg);
    } catch (err) {
      console.error('Queue consumer error', err);
      ch.nack(msg, false, true);
    }
  }, { noAck: false });
}

export { QUEUES };
