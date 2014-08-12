var express = require('express');
var morgan = require('morgan');
var exphbs = require('express3-handlebars');
var HomeController = require('./app/controllers/home');
var MonthController = require('./app/controllers/month');
var WeekController = require('./app/controllers/week');

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
app.get('/', WeekController.index);
app.get('/:year/:month', MonthController.index);
app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    return res.render('404', {
      pageTitle: 'Not found'
    });
  }

  // respond with json
  if (req.accepts('json')) {
    return res.send({ error: 'Not found' });
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

// Start server
var port = Number(process.env.PORT || 8080);
var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});

