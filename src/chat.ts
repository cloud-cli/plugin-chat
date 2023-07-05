import { Configuration, OpenAIApi } from "openai";
import { Request, Resource, Response } from "@cloud-cli/gw";
import { Bot, BotService } from "./bot-service.js";
import { AuthService } from "./auth-service.js";

const apiKey = String(process.env.API_KEY);

export class Chat extends Resource {
  readonly auth = AuthService.isAuthenticated;
  readonly openai = new OpenAIApi(new Configuration({ apiKey }));
  readonly body = { json: {} };

  async post(request: Request, response: Response): Promise<any> {
    let { bot, format = "", messages = [], context = {} } = request.body as any;

    if (!bot) {
      response.writeHead(400);
      response.end("Bot name is required");
      return;
    }

    const { id: owner } = await AuthService.getProfile(request);

    let assistant: Bot;

    try {
      assistant = await BotService.get(owner, bot);
    } catch (error) {
      console.log(error);
      response.writeHead(500);
      response.end();
      return;
    }

    const history = assistant.prepareMessagesForCompletion(messages, context);
    const start = Date.now();

    console.log("REQUEST", JSON.stringify(history));

    try {
      const completion = await this.openai.createChatCompletion(history);

      console.log(
        "RESPONSE in %s seconds",
        (Date.now() - start) / 1000,
        JSON.stringify(completion.data)
      );

      const responses = completion.data.choices;

      if (format === "text" || assistant.format === "text") {
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end(responses.map((c) => c.message.content).join("\n"));
        return;
      }

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(responses.map((c) => JSON.stringify(c.message)).join("\n"));
    } catch (error) {
      console.error(error);
      response.writeHead(500);
      response.end();
    }
  }
}
