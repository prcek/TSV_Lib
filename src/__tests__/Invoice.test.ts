import { InvoiceResolver } from '../invoice';
import { createMongooseConnection, createObjectId, mongod } from '../jestutils';

beforeEach(() => {
    // console.log('beforeEach');
    return mongod.start();
});
  
afterEach(() => {
    // console.log('afterEach');
    return mongod.stop();
});
  

test('Invoice CURD', async () => {
    // lookup.mockResolvedValueOnce({
    //   key: "1",
    //   course_cost: 1,
    //   paid: 1
    // });
    const muri = await mongod.getConnectionString();
    const mc = await createMongooseConnection(muri);
    const ir = new InvoiceResolver(mc)
    expect(await ir.getAll()).toHaveLength(0);
    expect(await ir.getOneById(createObjectId("123456789012").toHexString())).toBeNull();
    mc.close();
})