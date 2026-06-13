const { Client } = require('pg');

const users = ['postgres', 'root', 'admin'];
const passwords = ['', 'postgres', 'root', 'admin', 'password', '123456', '1234', '123', 'admin123', 'cure', 'cure_portal'];

async function test() {
  for (const user of users) {
    for (const password of passwords) {
      const client = new Client({
        host: '127.0.0.1', // use explicit IPv4
        port: 5432,
        user: user,
        password: password,
        database: 'postgres',
      });
      try {
        await client.connect();
        console.log(`SUCCESS: user='${user}', password='${password}'`);
        await client.end();
        process.exit(0);
      } catch (err) {
        console.log(`FAILED: user='${user}', password='${password}' - ${err.message}`);
      }
    }
  }
}

test();
