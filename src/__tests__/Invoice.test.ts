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
  

test('Invoice CUR - model', async () => {
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
    const newI = await ir.create({
        student_key: "ssk",
        no: "no1",
        s3key: null,
        duplicate: false,
        amount: 123,
        description: "popiska",
        sale_date: new Date(),
        issue_date: new Date(),
    });
    expect(newI).toHaveProperty("_id");
    expect(await ir.getAll()).toHaveLength(1);
    if (newI) {
        expect(await ir.getOneById(newI._id)).not.toBeNull();
        expect(await ir.getOneById(newI._id)).toHaveProperty("description","popiska");
        const up = await ir.updateOneById(newI._id,{description:"d2"});
        expect(up).toHaveProperty("description","d2");
        expect(await ir.getOneById(newI._id)).toHaveProperty("description","d2");
    } else {
        expect(true).toBe(false);
    }
 
    
    const newI2 = await ir.create({
        student_key: "ssk2",
        no: "no2",
        s3key: null,
        duplicate: false,
        amount: 123,
        description: "popiska2",
        sale_date: new Date(),
        issue_date: new Date(),
    });
    expect(await ir.getAll()).toHaveLength(2);
    expect(newI).toHaveProperty("_id");
    if (newI2) {
        expect(await ir.getOneById(newI2._id)).not.toBeNull();
    } else {
        expect(true).toBe(false);
    }
    mc.close();
})