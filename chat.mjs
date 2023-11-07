const baseUrl = "https://__BASE_URL__";

const cors = {
  mode: "cors",
  credentials: "include",
};

export const auth = {
  async isAuthenticated() {
    const req = await fetch(new URL("/auth", baseUrl), {
      method: "HEAD",
      ...cors,
    });
    return req.ok;
  },

  async getProfile() {
    const req = await fetch(new URL("/auth", baseUrl), cors);
    return req.ok ? await req.json() : null;
  },
};

export const bots = {
  async list() {
    const req = await fetch(new URL("/bots", baseUrl), cors);
    return req.ok ? await req.json() : null;
  },

  async getBot(name) {
    const req = await fetch(new URL("/bots/" + name, baseUrl), cors);
    return req.ok ? await req.json() : null;
  },
};

export const chat = {
  async ask(payload) {
    const {
      bot = "",
      format = "text",
      messages = [],
      context = {},
      model,
    } = payload;
    const body = JSON.stringify({ bot, format, messages, context, model });
    const req = await fetch(
      new URL("/chat", baseUrl, {
        method: "POST",
        body,
        ...cors,
      })
    );

    return req.ok ? await req.json() : null;
  },
};
