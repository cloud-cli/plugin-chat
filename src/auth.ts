import type { Request, Response } from "@cloud-cli/gw";
import { request as https } from "https";
import { Resource } from "@cloud-cli/gw";

const authKey = String(process.env.AUTH_KEY);
const authUrl = String(process.env.AUTH_URL);
const authProfileUrl = String(process.env.AUTH_PROFILE_URL);

export const AuthService = {
  async isAuthenticated(request: Request): Promise<boolean> {
    if (request.headers.cookie) {
      return AuthService.checkCookie(request);
    }

    if (request.headers.checkAuthorizationHeader) {
      return AuthService.checkAuthorizationHeader(request);
    }

    return false;
  },

  async checkCookie(request: Request) {
    return new Promise<boolean>((resolve) => {
      const cookie = request.headers.cookie;
      const auth = https(authUrl, { headers: { cookie } });

      auth.on("response", (res) => resolve(res.statusCode === 200));
      auth.on("error", (e) => {
        console.log(e);
        resolve(false);
      });
      auth.end();
    });
  },

  async checkAuthorizationHeader(request: Request) {
    const key = String(request.headers.authorization)
      .replace(/bearer/i, "")
      .trim();

    if (key) {
      return authKey === key;
    }

    return false;
  },

  async getProfile(request: Request): Promise<any> {
    return new Promise((resolve, reject) => {
      const auth = https(authProfileUrl, {
        headers: { cookie: request.headers.cookie || "" },
      });

      auth.on("response", (res) => {
        if (res.statusCode !== 200) {
          reject();
          return;
        }

        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")))
        );
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
