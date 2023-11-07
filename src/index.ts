import { createServer } from "http";
import { Gateway } from "@cloud-cli/gw";
import { Resource, StoreDriver } from "@cloud-cli/store";
import { Chat } from "./chat.js";
import { Auth } from "./auth.js";
import { Bots } from "./bots.js";
import { readFileSync } from "node:fs";
import { Bot } from "./bot-service.js";

const port = Number(process.env.PORT);
const api = new Gateway();

const client = readFileSync("./chat.mjs", "utf8");

api.add("auth", new Auth());
api.add("chat", new Chat());
api.add("bots", new Bots());

createServer((req, res) => {
  if (req.url === "/chat.mjs" || req.url === "/chat.js") {
    res.setHeader("cache-control", "public,max-age=604800");
    res.end(
      client.replace("__BASE_URL__", String(req.headers["x-forwarded-for"]))
    );
    return;
  }

  api.dispatch(req, res);
}).listen(port, () => {
  console.log(`Bot server running on port ${port}`);
  Resource.use(new StoreDriver());
  Resource.create(Bot);
});
