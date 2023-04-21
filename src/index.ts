import { createServer } from 'http';
import { Gateway, Request, Resource, Response } from '@cloud-cli/gw';
import { Configuration, OpenAIApi } from 'openai';

const port = Number(process.env.PORT);
const apiKey = String(process.env.API_KEY);
const AUTH_URL = String(process.env.AUTH_URL);
const maxTokens = process.env.API_MAX_TOKENS ? Number(process.env.API_MAX_TOKENS) : undefined;
const defaultModel = process.env.API_MODEL || 'gpt-3.5-turbo';
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);
const debug = !!process.env.DEBUG;

class Chat extends Resource {
  body = { json: {} };

  async post(request: Request, response: Response): Promise<any> {
    let { model, message, messages } = request.body as any;
    
    if (!message && !messages) {
      response.writeHead(400, 'Message required');
      response.end();
      return;
    }
    
    if (!messages) {
      messages = [{ role: 'user', content: String(message) }]
    }
    
    if (maxTokens) {
      const maxLength = maxTokens / 2;
      while (messages.length && String(messages.map(m => m.content)).length > maxLength) {
        messages.shift();
      }
    }
    
    if (!messages.length) {
      response.writeHead(400, 'Message too large');
      response.end();
      return;
    }

    const options = {
      model: model || defaultModel,
      max_tokens: maxTokens,
      messages,
    }

    const start = Date.now();
    if (debug) {
      console.log('REQUEST', JSON.stringify(options));
    }

    try {
      const completion = await openai.createChatCompletion(options);
  
      if (debug) {
        console.log('RESPONSE in %s seconds', Date.now() - start, JSON.stringify(completion.data));
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

const api = new Gateway();
api.add('chat', new Chat());

const server = createServer((req, res) => api.dispatch(req, res));
server.listen(port, () => console.log(`Server running on port ${port}`));
