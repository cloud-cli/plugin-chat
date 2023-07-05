import type { Request, Response } from "@cloud-cli/gw";
import { Resource } from "@cloud-cli/gw";
import { AuthService } from './auth-service';

export class Auth extends Resource {
  async head(request: Request, response: Response) {
    const auth = await AuthService.isAuthenticated(request);
    response.writeHead(auth ? 200 : 404);
    response.end();
  }

  async get(request: Request, response: Response) {
    try {
      const profile = await AuthService.getProfile(request);
      response.end(JSON.stringify({ id: profile.id }));
    } catch {
      response.writeHead(401);
      response.end();
    }
  }
}
