const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const createProxyRouteToPAS = require('./pas/createProxyRouteToPAS');
const config = require('./config/loadConfig');
const beginViewing = require('./routes/beginViewing');
const app = express();

app.use(logger('dev'));

// Setup the proxy to PrizmDoc Application Services (PAS).
// The viewer will send all of its requests for document content to the
// /prizmdoc-applications-services route and the proxy will forward those requests
// on to PAS. If you are using PrizmDoc Cloud, the proxy will also inject your API
// key before forwarding the request.
app.use(createProxyRouteToPAS('/pas-proxy', config.pasBaseUrl, config.apiKey));

// Register the react app as our default route.
app.use('/', express.static(path.join(__dirname, '../client/build')));

// Register POST /beginViewing?document={filename} so the client has a way to
// request the application server create a new viewing session for a given
// document.
app.use(beginViewing);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res /*, next*/) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
