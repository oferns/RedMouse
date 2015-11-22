var express = require('express'); // For routing
var path = require('path'); // to find the config file
var fs = require('fs'); // to read the config file

var favicon = require('serve-favicon'); // static favicon magic
var logger = require('morgan'); // request logging
var cookieParser = require('cookie-parser'); // parsing cookies, dummy, like the auth cookie
var bodyParser = require('body-parser'); // paring forms
var session = require('express-session'); // do I need this? cookie only or redis maybe
var passport = require('passport'); // For all your authentication needs
var flash = require('connect-flash'); // flash messages
var bunyan = require('bunyan'); // Application logging
var bunyanmw = require('bunyan-middleware'); // request logging



// lets get our config
var config = fs.readFileSync('./settings.json');
var settings = JSON.parse(config);


var stylus = require('stylus');


var log = bunyan.createLogger({
    name: 'redmouse',
    streams: [
        {
            level: 'info',
            stream: process.stdout            // log INFO and above to stdout
        },
        {
            level: 'debug',
            path: 'log/rm.log'  // log debug and above to a file
        }
    ]
});


var dc = require('documentdb').DocumentClient;
var smtp = require('sendgrid')(settings.sendGrid.userName, settings.sendGrid.password);
var docClient = new dc(settings.docDb.uri, { masterKey: settings.docDb.primaryKey });


var auth = require('../../modules/auth')(docClient, smtp);

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(bunyanmw(
    {
        headerName: 'X-Request-Id'
        , propertyName: 'reqId'
        , logName: 'req_id'
        , obscureHeaders: []
        , logger: log
    }
));

var accessLogStream = fs.createWriteStream(__dirname + 'log/access.log', { flags: 'a' });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev', { stream: accessLogStream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('redmouse'));
app.use(session({
    secret: 'redmouse',
    name: 'redmouse',
    proxy: true,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000,
        secure: false
    }
}));

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


app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

app.use(function (req, res, next) {
    res.locals.flash = {
        success: req.flash('success'),
        info: req.flash('info'),
        warning: req.flash('warning'), 
        error: req.flash('error')
    };
    
    next();
});

require('./config/passport')(passport, auth);

var routes = require('./routes/');  // index.js
var users = require('./routes/user/'); // index.js
var clubs = require('./routes/club/'); // index.js

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
else {
    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

module.exports = app;
