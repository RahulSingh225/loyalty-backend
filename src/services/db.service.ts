import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { InferModel } from 'drizzle-orm';

// Define the database client type
type PostgresClient = ReturnType<typeof postgres>;

// Database service class
export class DatabaseService {
  private client: PostgresClient;
  public db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    // Initialize PostgreSQL client with connection string
    this.client = postgres(connectionString, {
      max: 10, // Connection pool size
      idle_timeout: 20, // Seconds before idle connections close
      connect_timeout: 30, // Seconds before connection attempt times out
    });

    // Initialize Drizzle ORM with the client and schema
    this.db = drizzle(this.client);
  }

  // Method to check database connection
  async checkConnection(): Promise<boolean> {
    try {
      await this.client`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection error:', error);
      return false;
    }
  }

  // Method to close database connections
  async disconnect(): Promise<void> {
    try {
      await this.client.end();
    } catch (error) {
      console.error('Error closing database connections:', error);
      throw error;
    }
  }
}

// Example usage (optional, can be removed based on needs)
export async function initializeDb(connectionString: string): Promise<DatabaseService> {
  const dbService = new DatabaseService(connectionString);
  const isConnected = await dbService.checkConnection();
  
  if (!isConnected) {
    throw new Error('Failed to connect to database');
  }
  
  return dbService;
}