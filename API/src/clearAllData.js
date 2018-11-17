exports.handler = (function(){
    
    const transactionsCrud = require('./transactionsCrud');
    const dealerCrud = require('./dealerCrud');

    return function(req, res){
        Promise.all(transactionsCrud.deleteAllTransactions(), dealerCrud.deleteAllDealerNames())
        .then(function(){
            res.status(200).send();
        })
        .catch(function(error){
            res.status(500).json({error: error.toString()});
        });
    };
})();