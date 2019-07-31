import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { GraphQLInvoiceMutationType, GraphQLInvoiceQueryType, IInvoiceQueryContext, InvoiceResolver } from '../invoice';
import { createMongooseConnection, createObjectId, mongod } from '../jestutils';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      invoice: {
        type: GraphQLInvoiceQueryType,
        resolve: () => ({}),
      },
    }),
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
      invoice: {
        type: GraphQLInvoiceMutationType,
        resolve: () => ({}),
      },
    }),
  }),
});

beforeEach(() => {
  // console.log('beforeEach');
  return mongod.start();
});

afterEach(() => {
  // console.log('afterEach');
  return mongod.stop();
});

test('Invoice CUR - mongo', async () => {
  // lookup.mockResolvedValueOnce({
  //   key: "1",
  //   course_cost: 1,
  //   paid: 1
  // });
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const ir = new InvoiceResolver(mc);
  expect(mc.collections).toHaveProperty('invoices_NEW2');
  expect(mc.modelNames()).toContain('InvoiceNew');
  mc.close();
});

test('Invoice CUR - model', async () => {
  // lookup.mockResolvedValueOnce({
  //   key: "1",
  //   course_cost: 1,
  //   paid: 1
  // });
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const ir = new InvoiceResolver(mc);
  expect(await ir.getAll()).toHaveLength(0);
  expect(await ir.getOneById(createObjectId('123456789012').toHexString())).toBeNull();
  const newI = await ir.create({
    student_key: 'ssk',
    no: 'no1',
    s3key: null,
    duplicate: false,
    amount: 123,
    description: 'popiska',
    sale_date: new Date(),
    issue_date: new Date(),
  });
  expect(newI).toHaveProperty('_id');
  expect(await ir.getAll()).toHaveLength(1);
  if (newI) {
    expect(await ir.getOneById(newI._id)).not.toBeNull();
    expect(await ir.getOneById(newI._id)).toHaveProperty('description', 'popiska');
    const up = await ir.updateOneById(newI._id, { description: 'd2' });
    expect(up).toHaveProperty('description', 'd2');
    expect(await ir.getOneById(newI._id)).toHaveProperty('description', 'd2');
  } else {
    expect(true).toBe(false);
  }

  const newI2 = await ir.create({
    student_key: 'ssk2',
    no: 'no2',
    s3key: null,
    duplicate: false,
    amount: 123,
    description: 'popiska2',
    sale_date: new Date(),
    issue_date: new Date(),
  });
  expect(await ir.getAll()).toHaveLength(2);
  expect(newI).toHaveProperty('_id');
  if (newI2 && newI) {
    expect(await ir.getOneById(newI2._id)).not.toBeNull();
    expect(await ir.getOneById(newI._id)).toHaveProperty('description', 'd2');
    expect(await ir.updateOneById(newI2._id, { description: 'd3' })).toHaveProperty('description', 'd3');
    expect(await ir.getOneById(newI._id)).toHaveProperty('description', 'd2');
    expect(await ir.getOneById(newI2._id)).toHaveProperty('description', 'd3');
  } else {
    expect(true).toBe(false);
  }
  mc.close();
});

test('Invoice CUR - gql', async () => {
  const muri = await mongod.getConnectionString();
  const mc = await createMongooseConnection(muri);
  const ir = new InvoiceResolver(mc);

  const ctx: IInvoiceQueryContext = {
    invoiceResolver: ir,
  };

  const result = await graphql(
    schema,
    `
      query Q {
        invoice {
          all {
            id
            student_key
            __typename
          }
        }
      }
    `,
    {},
    ctx,
  );
  expect(result.data).not.toBeNull();
  expect(result.errors).toBeUndefined();
  if (result.data) {
    expect(result.data.invoice).not.toBeNull();
    if (result.data.invoice) {
      expect(result.data.invoice.all).not.toBeNull();
      if (result.data.invoice.all) {
        expect(result.data.invoice.all).toHaveLength(0);
      }
    }
  }
  const newI = await ir.create({
    student_key: 'ssk',
    no: 'no1',
    s3key: null,
    duplicate: false,
    amount: 123,
    description: 'popiska',
    sale_date: new Date(),
    issue_date: new Date(),
  });
  const newIid = newI ? newI._id.toString() : null;

  const result2 = await graphql(
    schema,
    `
      query Q {
        invoice {
          all {
            id
            student_key
            __typename
          }
        }
      }
    `,
    {},
    ctx,
  );
  expect(result2.data).not.toBeNull();
  expect(result2.errors).toBeUndefined();
  if (result2.data) {
    expect(result2.data.invoice).not.toBeNull();
    if (result2.data.invoice) {
      expect(result2.data.invoice.all).not.toBeNull();
      if (result2.data.invoice.all) {
        expect(result2.data.invoice.all).toHaveLength(1);
      }
    }
  }

  const result3 = await graphql(
    schema,
    `
      query Q($id: ID!) {
        invoice {
          byId(id: $id) {
            id
            student_key
            __typename
          }
        }
      }
    `,
    {},
    ctx,
    { id: newIid },
  );
  expect(result3.data).not.toBeNull();
  expect(result3.errors).toBeUndefined();
  if (result3.data && result3.data.invoice) {
    expect(result3.data.invoice).toHaveProperty('byId');
    if (result3.data.invoice.byId) {
      expect(result3.data.invoice.byId).toHaveProperty('id', newIid);
      expect(result3.data.invoice.byId).toHaveProperty('student_key', 'ssk');
    }
  } else {
    expect(true).toBe(false);
  }

  // mutations

  const result4 = await graphql(
    schema,
    `
      mutation M($id: ID!, $description: String) {
        invoice {
          update(id: $id, description: $description) {
            id
            student_key
            __typename
          }
        }
      }
    `,
    {},
    ctx,
    { id: newIid, description: 'upp' },
  );
  expect(result4.data).not.toBeNull();
  expect(result4.errors).toBeUndefined();
  if (result4.data && result4.data.invoice && result4.data.invoice.update) {
    expect(result4.data.invoice.update).toHaveProperty('student_key', 'ssk');
    const rr = await ir.getOneById(result4.data.invoice.update.id);
    expect(rr).not.toBeNull();
    expect(rr).toHaveProperty('description', 'upp');
  }

  const result5 = await graphql(
    schema,
    `
      mutation M($student_key: String!, $description: String, $no: String!) {
        invoice {
          create(description: $description, student_key: $student_key, no: $no) {
            id
            no
            student_key
            description
            __typename
          }
        }
      }
    `,
    {},
    ctx,
    { student_key: 'skk2', description: 'popiska2', no: 'no1' },
  );
  expect(result5.data).not.toBeNull();
  expect(result5.errors).toBeUndefined();

  const rr2 = await ir.getAll();
  expect(rr2).toHaveLength(2);

  mc.close();
});
