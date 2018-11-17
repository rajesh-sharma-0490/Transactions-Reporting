process.env.awsRegion = 'us-east-1';
process.env.transactionsTableName = 'galaxyinfra-transactions';
process.env.dealersTableName = 'galaxyinfra-dealers';
process.env.AWS_PROFILE = 'Kratos';

const app = require('./app');
const port = 9000;

app.listen(port)
console.log(`listening on http://localhost:${port}`);