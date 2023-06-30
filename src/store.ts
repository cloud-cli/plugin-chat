const storeUrl = process.env.STORE_URL;

export class Store<T = any> {
  private cache: Record<string, T> = {};

  constructor(protected name: string) {
    this.start();
  }

  async set(key: string, value: any) {
    this.cache[key] = value;
    await this.write(key, value);
    return true;
  }

  async get(key: string) {
    return this.cache[key] || (await this.read(key));
  }

  async delete(id: string) {
    const url = new URL(this.name + "/" + id, storeUrl);
    console.log("delete", String(url));
    await fetch(url, { method: "DELETE" });
    return true;
  }

  async list() {
    const url = new URL(this.name, storeUrl);
    console.log("list", String(url));
    const request = await fetch(url);
    const body = request.ok ? await request.json() : null;
    return (body && Object.values(body)) || body;
  }

  private write(id: string, content: any) {
    const url = new URL(this.name + "/" + id, storeUrl);
    console.log("write", String(url), content);
    return fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(content),
    });
  }

  private async read(id: string) {
    const url = new URL(this.name + "/" + id, storeUrl);
    console.log("read", String(url));
    const x = await fetch(url);
    return x.ok ? await x.json() : null;
  }

  private async start() {
    const all = await this.list();
    all.forEach((item: any) => (this.cache[item.uid] = item));
    console.log("store started with %d items", all.length);
  }
}
