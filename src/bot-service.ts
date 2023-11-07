import {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
} from "openai";
import { createHash } from "crypto";
import { Model, Primary, Property, Resource, Query } from "@cloud-cli/store";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const getUniqueId = (owner: string, name: string) => sha(`${owner}:${name}`);
const defaultModel = process.env.DEFAULT_MODEL;

@Model("bots")
export class Bot extends Resource {
  @Primary() @Property(String) uid: string;
  @Property(Number) owner: number;
  @Property(String) name: string;
  @Property(String) header: string;
  @Property(String) format: string;
  @Property(String, defaultModel) readonly model: string;

  getSystemHeader(
    context: Record<any, any> = {}
  ): ChatCompletionRequestMessage {
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
    const systemMessage = this.header ? [this.getSystemHeader(context)] : [];
    const history = systemMessage.concat(
      messages.filter((m) => m.role !== "system")
    );

    return {
      model: context.model || this.model || defaultModel,
      messages: history,
      response_format: {
        type: context.format === "json" ? "json_object" : "text",
      },
    };
  }

  toJSON() {
    return {
      owner: this.owner,
      name: this.name,
      header: this.header,
      format: this.format,
      model: this.model,
    };
  }
}

export const BotService = {
  async get(owner: string, name: string) {
    const uid = getUniqueId(owner, name);
    const bot = new Bot({ uid });
    return bot.find();
  },

  async list(owner: string) {
    console.log();
    return Resource.find(Bot, new Query<Bot>().where("owner").is(owner));
  },

  async set(owner: string, data: Partial<Bot>) {
    if (!owner || !data.name) {
      throw new Error("Name is required");
    }

    const uid = getUniqueId(owner, data.name);
    const bot = new Bot({ ...data, uid, owner });

    await bot.save();

    return bot;
  },

  remove(owner: string, name: string) {
    const uid = getUniqueId(owner, name);
    const bot = new Bot({ uid });
    return bot.remove();
  },
};
