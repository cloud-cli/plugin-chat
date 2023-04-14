import { createServer } from 'http';
import { Gateway, Request, Resource, Response } from '@cloud-cli/gw';
import { Configuration, OpenAIApi } from 'openai';

const port = Number(process.env.PORT);
const apiKey = String(process.env.API_KEY);
const maxTokens = process.env.API_MAX_TOKENS ? Number(process.env.API_MAX_TOKENS) : 4096;
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);
const debug = !!process.env.DEBUG;

class Chat extends Resource {
  body = { json: {} };

  async post(request: Request, response: Response): Promise<any> {
    if (debug) { console.log('REQUEST', request.body); }
    
    let { model, message, messages } = request.body as any;
    
    if (!message && !messages) {
      response.writeHead(400, 'Message required');
      response.end();
      return;
    }
    
    if (!messages) {
      messages = [{ role: 'user', content: String(message) }]
    }
    
    const maxLength = maxTokens / 2;
    while (messages.length && String(messages.map(m => m.content)) > maxLength) {
      messages.shift();
    }
    
    if (!messages.length) {
      response.writeHead(400, 'Message too large');
      response.end();
      return;
    }

    const options = {
      model: model || 'gpt-3.5-turbo',
      max_tokens: maxTokens,
      messages,
    }
    
    if (debug) { console.log('REQUEST', options); }
    const completion = await openai.createChatCompletion(options);

    if (debug) { console.log('RESPONSE', completion.data); }
    const responses = completion.data.choices.map((c) => JSON.stringify(c.message)).join('\n');
    
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end(responses);
  }
}

const api = new Gateway();
api.add('chat', new Chat());

const server = createServer((req, res) => api.dispatch(req, res));
server.listen(port, () => console.log(`Server running on port ${port}`));
