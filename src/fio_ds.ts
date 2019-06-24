import { Connection } from 'mongoose';

export class FioDataStore {
  private mongooseConnection: Connection;
  constructor(mcon: Connection) {
    this.mongooseConnection = mcon;
  }
  public async getMongoVersion(): Promise<string> {
    const info = await this.mongooseConnection.db.admin().buildInfo();
    console.log(`mongodb version ${info.version}`);
    return info.version;
  }
}
