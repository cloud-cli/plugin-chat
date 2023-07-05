import { createServer } from 'http';
import { Gateway } from '@cloud-cli/gw';
import { Resource, StoreDriver } from "@cloud-cli/store";
import { Chat } from './chat.js';
import { Auth } from './auth.js';
import { Bots } from './bots.js';

import { Bot } from './bot-service.js';

const port = Number(process.env.PORT);
const api = new Gateway();

api.add('auth', new Auth());
api.add('chat', new Chat());
api.add('bots', new Bots());

createServer((req, res) => api.dispatch(req, res)).listen(port, () => {
  console.log(`Bot server running on port ${port}`);
  Resource.use(new StoreDriver());
  Resource.create(Bot);
});
