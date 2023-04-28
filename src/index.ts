import { createServer } from 'http';
import { Gateway } from '@cloud-cli/gw';
import { Chat } from './chat';
import { Auth } from './auth';
import { Bots } from './bots';

const port = Number(process.env.PORT);
const api = new Gateway();

api.add('auth', new Auth());
api.add('chat', new Chat());
api.add('bots', new Bots());

createServer((req, res) => api.dispatch(req, res)).listen(port, () =>
  console.log(`Bot server running on port ${port}`),
);
