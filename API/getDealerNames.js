exports.handler = (function(){

    const dealerCrud = require('./dealerCrud');
    
    return function(req, res){

        dealerCrud.getAllDealerNames()
        .then(function(dealerNames){
            res.status(200).json({dealerNames: dealerNames || []});
        })
        .catch(function(error){
            res.status(500).json({error: error.toString()});
        });
    };
})();