import type { Request, Response } from '@cloud-cli/gw';
import { request as https } from 'https';
import { Resource } from '@cloud-cli/gw';

const authUrl = String(process.env.AUTH_URL);

export const AuthService = {
  async isAuthenticated(request: Request): Promise<boolean> {
    const cookie = request.headers.cookie;

    return new Promise((resolve) => {
      const auth = https(authUrl, { headers: { cookie } });
      auth.on('response', (res) => resolve(res.statusCode !== 200));
      auth.end();
    });
  },

  async getProfile(request: Request): Promise<any> {
    return new Promise((resolve, reject) => {
      const auth = https(authUrl, { headers: { cookie: request.headers.cookie } });
      auth.on('response', (res) => {
        if (res.statusCode !== 200) {
          reject();
          return;
        }

        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
      });
      auth.end();
    });
  },
};

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
