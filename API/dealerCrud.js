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

    return {
        batchWriteDealerNames: batchWriteDealerNames,
        getAllDealerNames: getAllDealerNames
    };
})();