import { Configuration, OpenAIApi } from 'openai';
import { Request, Resource, Response } from '@cloud-cli/gw';
import { BotService } from './bots.js';
import { AuthService } from './auth.js';

const apiKey = String(process.env.API_KEY);
const debug = !!process.env.DEBUG;

export class Chat extends Resource {
  auth = AuthService.isAuthenticated;
  readonly openai = new OpenAIApi(new Configuration({ apiKey }));
  readonly body = { json: {} };

  async post(request: Request, response: Response): Promise<any> {
    let { bot, messages } = request.body as any;

    if (!messages) {
      response.writeHead(400, 'Messages required');
      response.end();
      return;
    }

    if (!bot) {
      response.writeHead(400, 'Invalid bot');
      response.end();
      return;
    }

    const { id } = await AuthService.getProfile(request);
    response.setHeader('X-Bot', bot);

    const assistant = BotService.get(id, bot);
    const history = assistant.prepareMessagesForCompletion(messages);

    const start = Date.now();
    if (debug) {
      console.log('REQUEST', JSON.stringify(history));
    }

    try {
      const completion = await this.openai.createChatCompletion(history);

      if (debug) {
        console.log('RESPONSE in %s seconds', (Date.now() - start) / 1000, JSON.stringify(completion.data));
      }

      const responses = completion.data.choices.map((c) => JSON.stringify(c.message)).join('\n');

      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end(responses);
    } catch (error) {
      console.error(error);
      response.writeHead(500);
      response.end(String(error));
    }
  }
}
