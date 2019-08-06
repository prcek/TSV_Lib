import * as mongoose from 'mongoose';
import { FioCfg, IFioCfgRecord } from './fio_cfg';
import { FioDataStore } from './fio_ds';
import { FioReader } from './fio_reader';
import { FioSyncer, IFioSyncerLogger } from './fio_syncer';

type TLogFunction = (msg: string) => Promise<any>;
const nullLog: TLogFunction = async (m: string) => Promise.resolve(true);

interface IFioSyncerRecord {
  syncer: FioSyncer;
  cfg: IFioCfgRecord;
  name: string;
}

export class FioMultiSyncer {
  private list: IFioSyncerRecord[] = [];
  private logRaw: TLogFunction = nullLog;

  constructor(private logger: IFioSyncerLogger | null = null) {
    if (logger) {
      this.logRaw = logger.logRaw;
    }
  }

  public async _initOne(fs: FioSyncer, name: string): Promise<boolean> {
    // console.log("_initOne syncer account:",fs.getStore().getFioAccountId());
    const isTokenOk = await fs.checkToken();
    if (!isTokenOk) {
      this.logRaw('startFioFetch token problem ' + name);
      return false;
    }
    const isFirstSync = await fs.isFirstSync();
    this.logRaw('startFioFetch isFirstSync ' + isFirstSync + ' ' + name);
    const now = new Date();
    const recoveryDate = new Date(now.getTime() - 3600000 * 24 * 7); // 7 days
    this.logRaw('startFioFetch recovery from date ' + recoveryDate.toISOString() + ' ' + name);
    const recoveryResult = await fs.recoverSync(recoveryDate);
    this.logRaw('startFioFetch recoveryResult ' + recoveryResult + ' ' + name);
    return recoveryResult;
  }
  public async _syncLastOne(fs: FioSyncer, name: string): Promise<boolean> {
    // console.log("_syncLastOne syncer account:",fs.getStore().getFioAccountId());
    const r = await fs.syncLast();
    this.logRaw('FioFetch _syncLastOne r: ' + r + ' ' + name);
    return r;
  }

  public async init(): Promise<boolean> {
    const l = this.list.map(s => {
      return this._initOne(s.syncer, s.name);
    });
    const rl = await Promise.all(l);
    return rl.filter(v => !v).length === 0;
  }

  public async syncLast(): Promise<boolean> {
    const l = this.list.map(s => {
      return this._syncLastOne(s.syncer, s.name);
    });
    const rl = await Promise.all(l);
    return rl.filter(v => !v).length === 0;
  }

  public add(mcon: mongoose.Connection, cfg: IFioCfgRecord): FioSyncer {
    const fr = new FioReader(cfg.fioToken, cfg.fioAccountId);
    const ds = new FioDataStore(mcon, cfg.fioAccountId);
    const s = new FioSyncer(fr, ds, this.logger);
    const name = cfg.fioAccountId + '/' + cfg.firmKey;
    this.list.push({ syncer: s, cfg, name });
    return s;
  }
  public addAll(mcon: mongoose.Connection, cfg: FioCfg): FioSyncer[] {
    return cfg.getList().map(c => this.add(mcon, c));
  }
}
