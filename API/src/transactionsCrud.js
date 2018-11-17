module.exports = (function(){
    
    const awsServices = require('./awsServices');
    const settings = require('./settings');
    const writeBatchSize = 20;

    var fs = require('fs');
    var allFields = JSON.parse(fs.readFileSync('src/transactionDefinition.json'));

    function toDbModel(transaction){
        var translated = {
            challanNo: {S: transaction.challanNo.toString()}
        };

        allFields.forEach(function(field){
            if(transaction[field.name] == null || transaction[field.name] == undefined)
                return;

            var value = transaction[field.name].toString().toLowerCase().trim();
            if(value.length == 0)
                return;

            if(field.type == 'string'){
                translated[field.name] = {S: value};
            }
            else if(field.type == 'number'){
                if(isNaN(transaction[field.name]))
                    throw `Invalid numerical value: ${value}`;
                translated[field.name] = {N: value};
            }
        });

        return translated;
    }

    function getTransactionWriteBatches(transactions){
        var currentCount = 0;

        var allBatches = [];

        while(transactions.length > 0){
            var batch = transactions.splice(0, writeBatchSize);
            allBatches.push(batch);
        }

        return allBatches;
    }

    function writeTransactionBatch(batch){
        var client = awsServices.getDynamoDBClient();

        var request = {RequestItems: {}};
        request.RequestItems[settings.dynamoDb.tableNames.transactionsTableName] = batch.map(function(item){
            return {
                PutRequest: {
                    Item: item
                }
            };
        });

        return client.batchWriteItem(request).promise();
    }

    function batchWriteTransactions(transactions){
        var translatedCollection = transactions.map(function(transaction){
            return toDbModel(transaction);
        });

        var writeBatches = getTransactionWriteBatches(translatedCollection);

        var batchWriteTasks = writeBatches.map(function(batch){
            return writeTransactionBatch(batch);
        });

        return Promise.all(batchWriteTasks);
    }

    const mapTransaction = function(item){
        if(!item)
            return null;

        var parsed = {challanNo: item.challanNo.S};

        allFields.forEach(function(field){
            if(!item[field.name])
                return;

            switch(field.type){
                case "string":
                    parsed[field.name] = item[field.name].S;
                    break;
                case "number":
                    parsed[field.name] = item[field.name].N;
                    break;
            }
        });

        return parsed;
    }
    
    const getDealerTransactions = function(dealerName){
        var client = awsServices.getDynamoDBClient();

        var queryParams = {
            TableName: settings.dynamoDb.tableNames.transactionsTableName,
            IndexName: settings.dynamoDb.indexNames.dealerMaterialIndex,
            KeyConditionExpression: "dealerName = :dealerName",
            ExpressionAttributeValues: {
                ":dealerName": {S: dealerName}
            }
        }

        return new Promise(function (resolve, reject) {
            var parsed = [];
            function iterate() {
                client.query(queryParams, function (err, data) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    (data.Items || []).forEach(function (_item) {
                        parsed.push(mapTransaction(_item));
                    });

                    if (data.LastEvaluatedKey) {
                        queryParams.ExclusiveStartKey = data.LastEvaluatedKey;
                        iterate();
                        return;
                    }

                    resolve(parsed);
                });
            }

            iterate();
        });
    }

    const deleteAllTransactions = function(){
        var client = awsServices.getDynamoDBClient();

        var request = {
            TableName: settings.dynamoDb.tableNames.transactionsTableName
        };

        return new Promise(function (resolve, reject) {
            function iterate() {
                client.scan(request, function (err, response) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    var deletionTasks = [];
                    (response.Items || []).forEach(function (_item) {
                        var delRq = {
                            TableName: settings.dynamoDb.tableNames.transactionsTableName,
                            Key: {
                                challanNo: _item.challanNo
                            }
                        };
                        deletionTasks.push(client.deleteItem(delRq).promise());
                    });

                    Promise.all(deletionTasks).then(function(){
                        if (response.LastEvaluatedKey) {
                            request.ExclusiveStartKey = response.LastEvaluatedKey;
                            iterate();
                            return;
                        }

                        resolve();
                    }, function(error){
                        reject(error);
                    })
                });
            }

            iterate();
        });
    }
    
    return {
        batchWriteTransactions: batchWriteTransactions,
        getDealerTransactions: getDealerTransactions,
        deleteAllTransactions: deleteAllTransactions
    };
})();