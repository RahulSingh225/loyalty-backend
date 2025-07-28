
import {  db } from "../services/db.service";
import { firebaseService } from "../services/firebase.service";

export default abstract class BaseRepository {

  protected db
  
  constructor() {
    // Initialize the database connection from the DatabaseService
    this.db = db
    
    
  }



  // You can add common methods for all repositories here, if needed.
  // For example, a method to handle transactions or logging.

 
}