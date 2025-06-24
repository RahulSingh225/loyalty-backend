import { DatabaseService } from "../services/db.service";


class BaseRepository<T> {
  private items: T[] = [];
    protected dbService;

  constructor() {

  
      this.dbService = new DatabaseService(process.env.DATABASE_URL || '');
     
  }

 
}