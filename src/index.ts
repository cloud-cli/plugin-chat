import { createServer } from 'http';
import { Gateway, Request, Resource, Response } from '@cloud-cli/gw';
import { Configuration, OpenAIApi } from 'openai';

const port = Number(process.env.PORT);
const apiKey = String(process.env.API_KEY);
const maxTokens = process.env.API_MAX_TOKENS ? Number(process.env.API_MAX_TOKENS) : undefined;
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);
const debug = !!process.env.DEBUG;

class Chat extends Resource {
  body = { json: {} };

  async post(request: Request, response: Response): Promise<any> {
    let { model, message } = request.body as any;

    if (!message) {
      throw new Error('Message required');
    }

    const options = {
      model: model || 'gpt-3.5-turbo',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: String(message) }],
    }
    
    if (debug) { console.log('REQUEST', options); }
    const completion = await openai.createChatCompletion(options);

    if (debug) { console.log('RESPONSE', completion.data); }
    const messages = completion.data.choices.map((c) => JSON.stringify(c.message)).join('\n');
    
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end(messages);
  }
}

const api = new Gateway();
api.add('chat', new Chat());

const server = createServer((req, res) => api.dispatch(req, res));
server.listen(port, () => console.log(`Server running on port ${port}`));
