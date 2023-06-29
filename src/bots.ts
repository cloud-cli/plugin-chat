import { Request, Resource, Response } from "@cloud-cli/gw";
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
} from "openai";
import { AuthService } from "./auth";
import { createHash } from "crypto";
import { StoreMap } from "./store-map";

const defaultModel = "gpt-3.5-turbo";

const bots = new StoreMap("bots");
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export class Bots extends Resource {
  auth = AuthService.isAuthenticated;
  readonly body = { json: {} };

  async post(request: Request, response: Response) {
    const { name, header } = request.body as any;
    const { id } = await AuthService.getProfile(request);
    const bot = await BotService.create(id, name, header);

    response.writeHead(201);
    response.end(JSON.stringify(bot));
  }

  async put(request: Request, response: Response) {
    const { name, header } = request.body as any;
    const { id } = await AuthService.getProfile(request);
    await BotService.update(id, name, header);

    response.writeHead(202);
    response.end(name);
  }

  async get(request: Request, response: Response) {
    const { id } = await AuthService.getProfile(request);
    const name = request.url.slice(1);
    const bot = name
      ? await BotService.get(id, name)
      : await BotService.getAll(id);

    response.writeHead(bot ? 200 : 404);
    response.end(JSON.stringify(bot));
  }

  async delete(request: Request, response: Response) {
    const { id } = await AuthService.getProfile(request);
    const name = request.url.slice(1);
    BotService.remove(id, name);

    response.writeHead(204);
    response.end();
  }
}

export class Bot {
  readonly model: string = defaultModel;
  constructor(
    protected owner: string | number,
    protected name: string,
    protected header: string
  ) {}

  get preamble(): ChatCompletionRequestMessage {
    return { role: "system", content: this.header };
  }

  prepareMessagesForCompletion(
    messages: ChatCompletionRequestMessage[]
  ): CreateChatCompletionRequest {
    const systemMessage = this.header ? [this.preamble] : [];
    const history = systemMessage.concat(
      messages.filter((m) => m.role !== "system")
    );

    return { model: this.model, messages: history };
  }

  toJSON() {
    return {
      owner: Number(this.owner),
      name: this.name,
      header: this.header,
    };
  }
}

export const BotService = {
  getUniqueId(id: string, name: string) {
    return sha(`${id}:${name}`);
  },

  get(owner: string, name: string) {
    const uid = BotService.getUniqueId(owner, name);
    return bots.get(uid);
  },

  getAll(owner: string) {
    const id = Number(owner);
    const botList = [];

    bots.forEach((bot) => {
      if (bot?.owner === id) {
        botList.push(bot);
      }
    });

    return botList;
  },

  create(owner: string, name: string, header: string) {
    if (!owner || !name) {
      throw new Error("Name and header are required");
    }

    const uid = BotService.getUniqueId(owner, name);
    const bot = new Bot(Number(owner), name, header);
    bots.set(uid, bot);
    return bot;
  },

  update(owner: string, name: string, header: string) {
    if (!owner || !name) {
      throw new Error("Name and header are required");
    }

    const uid = BotService.getUniqueId(owner, name);
    const bot = new Bot(Number(owner), name, header);
    bots.set(uid, bot);
    return bot;
  },

  remove(owner: string, name: string) {
    const uid = BotService.getUniqueId(owner, name);
    return bots.delete(uid);
  },
};
