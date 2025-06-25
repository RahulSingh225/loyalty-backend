import { eq } from "drizzle-orm";
import { contentManagement } from "../db/schema";
import BaseRepository from "./base.repository";



export default class ContentRepository extends BaseRepository {
  
  async listContents(type:string): Promise<string[]> {
    const result = await this.db.select().from(contentManagement).where(eq(contentManagement.contentType, type));
    return result
  }

  async saveContent(id: string, content: string): Promise<void> {
    await this.db.insert(contentManagement).values({ id, content }).execute();
  }

//   async deleteContent(id: string): Promise<void> {
//     //delete this.contents[id];
//   }
}