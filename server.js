var bunyan = require('express-bunyan-logger');
var express = require('express');
var exphbs = require('express3-handlebars');
var homeController = require('./app/controllers/home');
var monthController = require('./app/controllers/month');
var errorController = require('./app/controllers/error');

// Configure app
var app = express();
app.use(bunyan({ name: 'quick-links', level: 'info' }));
app.set('views', __dirname + '/app/views');
app.engine('hbs', exphbs({
  defaultLayout: __dirname + '/app/views/layouts/default',
  extname: '.hbs',
  partialsDir: __dirname + '/app/views/partials'
}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));

// Add routes
app.get('/', homeController.index);
app.get('/:year/month/:month', monthController.index);
app.use(errorController.index);

// Start server
var port = Number(process.env.PORT || 8080);
var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
