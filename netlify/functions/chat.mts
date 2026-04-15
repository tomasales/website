import { handleChatRequest } from '../../src/server/chat-handler';

export default async (request: Request) => handleChatRequest(request);

export const config = {
  path: '/api/chat',
};
