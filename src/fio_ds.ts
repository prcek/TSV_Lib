import * as mongoose  from 'mongoose';

export class FioDataStore {
  private mongooseConnection: mongoose.Connection;
  constructor(mcon: mongoose.Connection) {
    this.mongooseConnection = mcon;
  }
  public async getMongoVersion(): Promise<string> {
    const info = await this.mongooseConnection.db.admin().buildInfo();
    console.log(`mongodb version ${info.version}`);
    return info.version;
  }
}
