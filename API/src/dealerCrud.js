module.exports = (function(){

    const awsServices = require('./awsServices');
    const settings = require('./settings');
    const writeBatchSize = 20;

    const getUniqueNames = function(dealerNames){
        var nameMap = {};

        dealerNames.forEach(function(dealerName){
            var _name = (dealerName || '').toLowerCase();
            if(_name.length == 0)
                return;

            nameMap[_name] = '';
        });

        return Object.keys(nameMap);
    }

    function writeDealerNamesBatch(batch){
        var client = awsServices.getDynamoDBClient();

        var request = {RequestItems: {}};
        request.RequestItems[settings.dynamoDb.tableNames.dealersTableName] = batch.map(function(dealerName){
            return {
                PutRequest: {
                    Item: {dealerName: {S: dealerName}}
                }
            };
        });

        return client.batchWriteItem(request).promise();
    }

    const batchWriteDealerNames = function(dealerNames){
        var uniqueNames = getUniqueNames(dealerNames);

        var batches = [];
        while(uniqueNames.length > 0)
            batches.push(uniqueNames.splice(0, writeBatchSize));

        var writeTasks = batches.map(function(batch){
            return writeDealerNamesBatch(batch);
        });

        return Promise.all(writeTasks);
    }

    const getAllDealerNames = function(){
        var client = awsServices.getDynamoDBClient();

        var params = {
            TableName: settings.dynamoDb.tableNames.dealersTableName
        }

        return new Promise(function(resolve, reject){
            client.scan(params, function(err, data){
                if(err){
                    reject(err);
                    return;
                }

                var dealerNames = [];
                (data.Items || []).forEach(function(item){
                    dealerNames.push(item.dealerName.S);
                });

                resolve(dealerNames);
            });
        });
    }


    const deleteAllDealerNames = function(){
        var client = awsServices.getDynamoDBClient();

        var request = {
            TableName: settings.dynamoDb.tableNames.dealersTableName
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
                            TableName: settings.dynamoDb.tableNames.dealersTableName,
                            Key: {
                                dealerName: _item.dealerName
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
        batchWriteDealerNames: batchWriteDealerNames,
        getAllDealerNames: getAllDealerNames,
        deleteAllDealerNames: deleteAllDealerNames
    };
})();