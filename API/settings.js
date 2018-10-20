module.exports = {
    dynamoDb: {
        tableNames: {
            transactionsTableName: process.env.transactionsTableName,
            dealersTableName: process.env.dealersTableName
        },
        indexNames: {
            dealerMaterialIndex: 'dealerMaterialIndex'
        },
        tableAttributes: {
            transactions: {
                
            }
        }
    }
};