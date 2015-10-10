﻿var fs = require('fs');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var Auth = require('./services/Auth');
var stylus = require('stylus');
var app = express();



var config = fs.readFileSync('./settings.json');

var settings = JSON.parse(config);

var auth = new Auth(settings);

var accessLogStream = fs.createWriteStream(__dirname + '/access.log', { flags: 'a' });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev', { stream: accessLogStream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('secret'));
app.use(session({
    secret: 'secret',
    name: 'palmers',
    proxy: true,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000,
        secure: false
    }
}));

// app.use(require('stylus').middleware(path.join(__dirname, 'public')));

app.use(
    stylus.middleware({
        src: path.join(__dirname, "assets/stylus/style.styl"), 
        dest: __dirname + "/public/css",
        debug: true,
        compile : function (str, path) {
            console.log('compiling');
            return stylus(str)
        .set('filename', path)
        .set('warn', true)
        .set('compress', false);
        }
    })
);

app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

app.use(function (req, res, next) {
    res.locals.flash = {
        success: req.flash('success'),
        info: req.flash('info'),
        warning: req.flash('warning'), 
        error: req.flash('error')
    }
    
    next()
});

require('./config/passport')(passport, auth);

var routes = require('./routes/index');
var users = require('./routes/user');
var clubs = require('./routes/club/');
app.use('/', routes);
app.use('/', users);
app.use('/club', clubs);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
