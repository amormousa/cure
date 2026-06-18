const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres@localhost:5432/cure_portal' });

client.connect()
  .then(() => client.query('SELECT id, email, name, role, "isActive" FROM "User" WHERE email = \'nurse.1@cure.health\''))
  .then(r => console.log("User nurse.1:", r.rows))
  .catch(console.error)
  .finally(() => client.end());
