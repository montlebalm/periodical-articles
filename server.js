'use strict';

var _ = require('underscore');
var config = require('config');
var express = require('express');
var morgan = require('morgan');
var exphbs = require('express3-handlebars');
var moment = require('moment');
var BookmarkSvc = require('./app/services/BookmarkSvc');

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

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/:year/:month', function(req, res) {
  var year = req.param('year');
  var month = req.param('month');
  var date = moment([year, month]);

  if (date.isValid()) {
    var sections = config.get('sections').map(function(section) {
      return _.extend({}, section);
    });
    var unassigned = [];

    // Get the bookmarks for this month
    BookmarkSvc.getByMonth(month, function(err, bookmarks) {
      bookmarks.forEach(function(bm) {
        var matched = false;

        for (var x = 0; x < bm.tags.length; x++) {
          var tag = bm.tags[x];

          for (var y = 0; y < sections.length; y++) {
            var sec = sections[y];

            if (_.contains(sec.tags, tag)) {
              if (!sec.bookmarks) {
                sec.bookmarks = [];
              }

              sec.bookmarks.push(bm);
              matched = true;
              break;
            }
          }

          if (matched) {
            break;
          }
        }

        if (!matched) {
          unassigned.push(bm);
        }
      });

      // Toss on the unassigned section for easier formatting
      sections.push({
        title: 'Unassigned',
        bookmarks: unassigned
      });

      res.render('month', {
        pageTitle: 'Links for ' + date.format('MMMM') + ', ' + year,
        month: date.format('MMMM'),
        year: date.year(),
        sections: sections
      });
    });
  } else {
    res.send(404);
  }
});

var port = Number(process.env.PORT || 8080);
var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});

