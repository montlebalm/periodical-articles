var _ = require('underscore');
var async = require('async');
var config = require('config');
var moment = require('moment');
var BookmarkSvc = require('../services/BookmarkSvc');

var user = process.env.PINBOARD_USER || config.get('pinboard.user');

function _getCategories() {
  return config.get('categories').map(function(cat) {
    return _.extend({ bookmarks: [] }, cat);
  });
}

function _getPageUrl(year, month) {
  return '/' + year + '/' + (parseInt(month) + 1);
}

module.exports = {
  index: function(req, res) {
    var year = req.param('year');
    var month = req.param('month');
    var date = moment([year, month - 1]);

    if (date.isValid()) {
      var categories = _getCategories();
      var lastMonthDate = moment(date).subtract('months', 1);
      var nextMonthDate = moment(date).add('months', 1);

      async.parallel({
        hasPostsLastMonth: function(next) {
          BookmarkSvc.hasPostsInMonth(lastMonthDate.year(), lastMonthDate.month(), next);
        },
        hasPostsNextMonth: function(next) {
          BookmarkSvc.hasPostsInMonth(nextMonthDate.year(), nextMonthDate.month(), next);
        },
        bookmarks: function(next) {
          var startDate = moment(date).startOf('month');
          var endDate = moment(date).endOf('month');
          BookmarkSvc.getPostsForDateRange(startDate.toDate(), endDate.toDate(), next);
        }
      }, function(err, results) {
        var lastMonthUrl = (results.hasPostsLastMonth) ? _getPageUrl(lastMonthDate.year(), lastMonthDate.month()) : null;
        var nextMonthUrl = (results.hasPostsNextMonth) ? _getPageUrl(nextMonthDate.year(), nextMonthDate.month()) : null;

        // Group bookmarks under categories
        categories.forEach(function(category) {
          for (var i = 0; i < results.bookmarks.length; i++) {
            if (_.intersection(results.bookmarks[i].tags, category.tags).length > 0) {
              category.bookmarks.push(results.bookmarks[i]);
              // Pull the bookmark out of the list
              // This enforces a pseudo "priority" system
              results.bookmarks.splice(i--, 1);
            }
          }
        });

        // Toss on the unassigned section for easier formatting
        categories.push({
          title: 'Everything else',
          bookmarks: results.bookmarks
        });

        // Remove categories without links
        categories = categories.filter(function(section) {
          return section.bookmarks && section.bookmarks.length;
        });

        if (categories.length) {
          res.render('month', {
            pageTitle: 'Links for ' + date.format('MMMM') + ', ' + year,
            archiveUrl: 'https://pinboard.in/u:' + user,
            lastMonthUrl: lastMonthUrl,
            nextMonthUrl: nextMonthUrl,
            month: date.format('MMMM'),
            year: date.year(),
            categories: categories
          });
        } else {
          res.render('empty', {
            pageTitle: 'Nothing!'
          });
        }
      });
    } else {
      res.send(404);
    }
  }
};

