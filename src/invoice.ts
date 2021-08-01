import * as mongoose from 'mongoose';
import * as R from 'ramda';

import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

// import { GraphQLDate, GraphQLDateTime } from 'graphql-iso-date';
import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars';

export interface IInvoice {
  _id?: any;
  student_key: string;
  no: string;
  s3key: string | null;
  duplicate: boolean;
  amount: number;
  description: string;
  sale_date: Date;
  issue_date: Date;
  created_at: Date;
  updated_at: Date;
}

export const GraphQLInvoiceType = new GraphQLObjectType<IInvoice, any>({
  name: 'InvoiceNew',
  fields: {
    id: { type: GraphQLID },

    student_key: {
      type: GraphQLString,
    },

    no: {
      type: GraphQLString,
    },

    s3key: {
      type: GraphQLString,
    },

    file_url: {
      type: GraphQLString,
      resolve: (parent, args, context, info) => {
        if (parent.s3key) {
          return '/fileblob/' + parent.s3key;
        }
        return null;
      },
    },

    printed: {
      type: GraphQLBoolean,
      resolve: (parent, args, context, info) => {
        if (parent.s3key) {
          return true;
        }
        return false;
      },
    },

    duplicate: { type: GraphQLBoolean },
    amount: { type: GraphQLInt },

    description: {
      type: GraphQLString,
    },

    sale_date: {
      type: GraphQLDate,
    },
    issue_date: {
      type: GraphQLDate,
    },

    created_at: {
      type: GraphQLDateTime,
    },
    updated_at: {
      type: GraphQLDateTime,
    },
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    student_key: {
      type: String,
      required: true,
    },

    no: {
      type: String,
    },

    s3key: {
      type: String,
    },

    duplicate: {
      type: Boolean,
    },

    amount: {
      type: Number,
    },

    description: {
      type: String,
    },

    sale_date: {
      type: Date,
    },
    issue_date: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export interface IInvoiceModel extends mongoose.Document, IInvoice {}

import { ResolverBase } from './resolver';
import { OmitProps, OrUndefined } from './utils';

function getStringValuesFromEnum<T>(myEnum: T): string[] {
  return Object.keys(myEnum).filter(k => typeof (myEnum as any)[k] === 'number');
}

enum ENo {
  _id,
  created_at,
  updated_at,
}
type IInvoiceR = OmitProps<IInvoice, typeof ENo>;
export class InvoiceResolver extends ResolverBase<IInvoice, IInvoiceR, IInvoiceModel> {
  constructor(mongooseConnection: mongoose.Connection) {
    super(mongooseConnection, 'InvoiceNew', invoiceSchema, 'invoices_NEW2');
  }

  public async getAll(): Promise<IInvoice[]> {
    return this.model.find();
  }

  public async getOneById(id: string): Promise<IInvoice | null> {
    return this.model.findById(id);
  }

  public async create(obj: IInvoiceR): Promise<IInvoice | null> {
    const co = R.omit(getStringValuesFromEnum(ENo), obj);
    return this.model.create(co);
  }
  public async updateOneById(id: string, obj: OrUndefined<IInvoiceR>): Promise<IInvoice | null> {
    const uo = R.omit(getStringValuesFromEnum(ENo), obj);
    return this.model.findByIdAndUpdate(id, uo, { new: true });
  }
}
export interface IInvoiceQueryContext {
  invoiceResolver: InvoiceResolver;
}

export const GraphQLInvoiceQueryType = new GraphQLObjectType<any, IInvoiceQueryContext, any>({
  name: 'InvoiceQuery',
  fields: {
    byId: {
      type: GraphQLInvoiceType,
      args: {
        id: { type: GraphQLID },
      },
      resolve: async (_, args, ctx) => {
        // ctx.invoiceResolver.create(args)
        return ctx.invoiceResolver.getOneById(args.id);
      },
    },
    all: {
      type: new GraphQLList(GraphQLInvoiceType),
      resolve: (_, args, ctx) => {
        return ctx.invoiceResolver.getAll();
      },
    },
  },
});

export const GraphQLInvoiceMutationType = new GraphQLObjectType<any, IInvoiceQueryContext, any>({
  name: 'InvoiceMutation',
  fields: {
    create: {
      type: GraphQLInvoiceType,
      args: {
        student_key: {
          type: new GraphQLNonNull(GraphQLString),
        },

        no: {
          type: new GraphQLNonNull(GraphQLString),
        },

        s3key: {
          type: GraphQLString,
        },

        duplicate: { type: GraphQLBoolean },

        amount: { type: GraphQLInt },

        description: {
          type: GraphQLString,
        },

        sale_date: {
          type: GraphQLDate,
        },
        issue_date: {
          type: GraphQLDate,
        },
      },
      resolve: async (_, args, ctx) => {
        return ctx.invoiceResolver.create(args);
      },
    },
    update: {
      type: GraphQLInvoiceType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },

        student_key: {
          type: GraphQLString,
        },

        no: {
          type: GraphQLString,
        },

        s3key: {
          type: GraphQLString,
        },

        duplicate: { type: GraphQLBoolean },

        amount: { type: GraphQLInt },

        description: {
          type: GraphQLString,
        },

        sale_date: {
          type: GraphQLDate,
        },
        issue_date: {
          type: GraphQLDate,
        },
      },
      resolve: (_, args, ctx) => {
        return ctx.invoiceResolver.updateOneById(args.id, args); // id or _id !!!!
      },
    },
  },
});
