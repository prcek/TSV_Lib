import * as mongoose from 'mongoose';
import { Maybe, OmitId, OrUndefined } from './utils';

export abstract class ResolverBase<T, TO, TM extends mongoose.Document> {
  public static kickId<T extends { _id: any }>(obj: OrUndefined<T>): OrUndefined<OmitId<T>> {
    const o = Object.assign({}, obj);
    delete o._id;
    return o;
  }

  protected model: mongoose.Model<TM>;

  constructor(
    private mongooseConnection: mongoose.Connection,
    name: string,
    schema: mongoose.Schema,
    collection: string,
  ) {
    this.model = this.mongooseConnection.model<TM>(name, schema, collection);
  }
  public abstract create(obj: TO): Promise<T | null>;
  public abstract updateOneById(id: string, obj: OrUndefined<TO>): Promise<T | null>;

  public abstract getAll(): Promise<T[]>;
  public abstract getOneById(id: string): Promise<T | null>;
}
