module.exports = (function(){
    var AWS = require("aws-sdk");

    AWS.config.update({region: process.env.awsRegion});

    return {
        getDynamoDBClient : function(){
            return new AWS.DynamoDB();  
        }
    };
})();