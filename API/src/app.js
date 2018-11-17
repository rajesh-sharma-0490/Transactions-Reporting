const express = require('express');
const bodyParser = require('body-parser');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

const app = express();

const uploadData = require('./uploadData');
const getDealerNames = require('./getDealerNames');
const queryVendorData = require('./queryDealerData');
const clearAllData = require('./clearAllData');

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization,Content-Type");
    next();
});

app.use(bodyParser.json({limit: '50mb'}));
app.use(awsServerlessExpressMiddleware.eventContext());

app.post('/uploadData', uploadData.handler);
app.get('/dealerNames', getDealerNames.handler);
app.get('/dealer/:dealerName', queryVendorData.handler);
app.get('/clearAllData', clearAllData.handler);

module.exports = app;