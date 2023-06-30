import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
} from "openai";
import { createHash } from "crypto";
import { Store } from "./store";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const bots = new Store("bots");
const defaultModel = "gpt-3.5-turbo";

export const BotService = {
  getUniqueId(id: string, name: string) {
    return sha(`${id}:${name}`);
  },

  async get(owner: string, name: string) {
    const uid = BotService.getUniqueId(owner, name);
    const data = await bots.get(uid);

    if (!data) {
      throw new Error("404");
    }

    return new Bot(owner, data.name, data.header);
  },

  async list(owner: string) {
    const id = Number(owner);
    const botList = await bots.list();

    return botList.filter((bot) => bot?.owner === id);
  },

  async set(owner: string, name: string, header: string) {
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

export class Bot {
  readonly model: string = defaultModel;
  constructor(
    protected owner: string | number,
    protected name: string,
    protected header: string
  ) {}

  getPreamble(context: Record<any, any> = {}): ChatCompletionRequestMessage {
    return {
      role: "system",
      content: this.header.replace(
        /\{([\s\S]+?)\}/g,
        (_, inner) => context[inner.trim()] || ""
      ),
    };
  }

  prepareMessagesForCompletion(
    messages: ChatCompletionRequestMessage[],
    context?: Record<any, any>
  ): CreateChatCompletionRequest {
    const systemMessage = this.header ? [this.getPreamble(context)] : [];
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
