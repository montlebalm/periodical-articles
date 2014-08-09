var express = require('express');
var morgan = require('morgan');
var exphbs = require('express3-handlebars');
var HomeController = require('./app/controllers/home');
var MonthController = require('./app/controllers/month');

// Init and configure app
var app = express();
app.use(morgan('combined'));
app.set('views', __dirname + '/app/views');
app.engine('hbs', exphbs({
  defaultLayout: __dirname + '/app/views/layouts/default',
  extname: '.hbs',
  partialsDir: __dirname + '/app/views/partials'
}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));

// Routes
app.get('/', HomeController.index);
app.get('/:year/:month', MonthController.index);

// Start server
var port = Number(process.env.PORT || 8080);
var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});

