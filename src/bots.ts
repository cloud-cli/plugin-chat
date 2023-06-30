import { Request, Resource, Response } from "@cloud-cli/gw";
import { AuthService } from "./auth";
import { BotService } from "./bot-service";

export class Bots extends Resource {
  auth = AuthService.isAuthenticated;
  readonly body = { json: {} };

  private async updateBot(request: Request, response: Response) {
    const { name, header } = request.body as any;
    const { id } = await AuthService.getProfile(request);
    const bot = await BotService.set(id, name, header);

    response.writeHead(202, { "content-type": "application/json" });
    response.end(JSON.stringify(bot));
  }

  async post(request: Request, response: Response) {
    return this.updateBot(request, response);
  }

  async put(request: Request, response: Response) {
    return this.updateBot(request, response);
  }

  async get(request: Request, response: Response) {
    const { id } = await AuthService.getProfile(request);
    const name = request.url.slice(1);
    const bot = name
      ? await BotService.get(id, name)
      : await BotService.list(id);

    response.writeHead(bot ? 200 : 404);
    response.end(JSON.stringify(bot));
  }

  async delete(request: Request, response: Response) {
    const { id } = await AuthService.getProfile(request);
    const name = request.url.slice(1);
    await BotService.remove(id, name);

    response.writeHead(204);
    response.end();
  }
}
