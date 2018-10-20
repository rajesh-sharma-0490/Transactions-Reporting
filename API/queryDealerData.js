exports.handler = (function(){

    const transactionsCrud = require('./transactionsCrud');
    
    const validateRequest = function(req){
        if(!req.params.dealerName)
            throw "dealer name is mandatory";
    }

    return function(req, res){
        try{
            validateRequest(req);
        }catch(error){
            res.status(400).json({error: error.toString()});
            return;
        }

        transactionsCrud.getDealerTransactions(req.params.dealerName)
        .then(function(transactions){
            res.status(200).json({transactions: transactions});
        })
        .catch(function(error){
            res.status(500).json({error: error.toString()});
        });
    };
})();