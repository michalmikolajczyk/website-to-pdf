var express = require('express');
var exec = require('child_process').exec;
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var pdf = require('./routes/pdf');
var users = require('./routes/users');

var app = express();

// clear the tmp directory
exec('rm -rf tmp/*', function (error, stdout, stderr) {
  console.log('rm -rf tmp/*');
  if (stdout) console.log('stdout: ' + stdout);
  if (stderr) console.log('stderr: ' + stderr);
  if (error !== null) console.log('exec error: ' + error);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/pdf', pdf);

// redirect to https
app.use(function (req, res, next) {
  if (req.headers.host === 'localhost:3000') {
    return next();
  }
  var schema = (req.headers['x-forwarded-proto'] || '').toLowerCase();
  if (schema === 'https') {
    return next();
  } else {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
