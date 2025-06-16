import { RedisClientType, createClient } from "redis";

export class RedisClient {
  private readonly redisClient: RedisClientType;

  constructor() {
    //this.redisClient = createClient()
    this.redisClient = createClient({
      socket: { host: process.env.REDIS_HOST },
    });
    this.initialize();
  }

  private async initialize() {
    this.redisClient.on("error", async (err: string) => {
      console.log("Could not establish a connection with redis. " + err);
      await this.redisClient.disconnect();
    });

    this.redisClient.on("connect", () => {
      console.log("Connected to redis successfully");
    });
    await this.redisClient.connect();
  }

  async setKey(userId: number, refreshToken: string): Promise<void> {
    try {
      await this.redisClient.set(`${userId}`, refreshToken);
    } catch (error) {
      console.log(error);
    }
  }

  async setStringKey(userId: string, refreshToken: string): Promise<void> {
    try {
      await this.redisClient.set(`${userId}`, refreshToken);
    } catch (error) {
      console.log(error);
    }
  }

  async getValue(userId: number): Promise<string | null> {
    try {
      const refreshTokenValue: string | null = await this.redisClient.get(
        `${userId}`
      );
      return refreshTokenValue;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  async getStringValue(userId: string): Promise<string | null> {
    try {
      const refreshTokenValue: string | null = await this.redisClient.get(
        `${userId}`
      );
      return refreshTokenValue;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteKey(userId: number) {
    try {
      await this.redisClient.del(`${userId}`);
    } catch (error) {
      console.log(error);
    }
  }

  isLive(): boolean {
    return this.redisClient.isReady;
  }

  private async setExpiry(userId: number): Promise<void> {
    try {
      await this.redisClient.expire(`${userId}`, 30 * 24 * 60 * 60);
    } catch (error) {
      console.log(error);
    }
  }
}
