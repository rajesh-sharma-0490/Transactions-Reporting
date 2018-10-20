exports.handler = (function(){
    
    const transactionsCrud = require('./transactionsCrud');
    const dealerCrud = require('./dealerCrud');

    const mandatoryFields = ['challanNo'];

    function validateRequest(req){
        var body = req.body || {};

        if((body.transactions || []).length == 0)
            throw "No transactions provided to upload";

        body.transactions.forEach(function(transaction){
            if(!transaction)
                return;

            mandatoryFields.forEach(function(field){
                var value = (transaction[field] || '').toString().trim();
                if(value.length == 0)
                    throw `${field} is mandatory for all transactions.`;
            });
        });
    }
    
    return function(req, res){
        try{
            validateRequest(req);
        }catch(error){
            res.status(400).json({error: error.toString()});
            return;
        }

        var allDealerNames = req.body.transactions.map(function(transaction){
            return transaction.dealerName;
        });
        

        Promise.all([
            transactionsCrud.batchWriteTransactions(req.body.transactions),
            dealerCrud.batchWriteDealerNames(allDealerNames)])
        .then(function(){
            res.status(200).send();
        })
        .catch(function(error){
            res.status(500).json({error: error.toString()});
        });
    };
})();