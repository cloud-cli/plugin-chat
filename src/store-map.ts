const storeUrl = process.env.STORE_URL;

export class StoreMap extends Map<string, any> {
  protected enableWrite = false;

  constructor(protected name: string) {
    super();
    this.start();
  }

  set(key: string, value: any) {
    const v = super.set(key, value);

    if (this.enableWrite) {
      this.write(key, value);
    }

    return v;
  }

  delete(id: string): boolean {
    fetch(storeUrl + this.name + "/" + id, { method: "DELETE" });
    return super.delete(id);
  }

  private write(id: string, content: any) {
    return fetch(storeUrl + this.name + "/" + id, {
      method: "PUT",
      body: JSON.stringify(content),
    });
  }

  private async list() {
    return Object.values(
      await fetch(storeUrl + this.name).then((x) => x.json())
    );
  }

  private async start() {
    const files = await this.list();
    files.forEach((file) => this.set(file.uid, file));
    this.enableWrite = true;
  }
}
