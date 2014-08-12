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
        categories: function(next) {
          var startDate = moment(date).startOf('month');
          var endDate = moment(date).endOf('month');
          BookmarkSvc.getPostsForDateRange(startDate.toDate(), endDate.toDate(), function(err, bookmarks) {
            BookmarkSvc.groupBookmarksByCategory(bookmarks, categories, next);
          });
        }
      }, function(err, results) {
        var lastMonthUrl = (results.hasPostsLastMonth) ? _getPageUrl(lastMonthDate.year(), lastMonthDate.month()) : null;
        var nextMonthUrl = (results.hasPostsNextMonth) ? _getPageUrl(nextMonthDate.year(), nextMonthDate.month()) : null;
        var finalCategories = results.categories.filter(function(section) {
          return section.bookmarks && section.bookmarks.length;
        });

        if (finalCategories.length) {
          res.render('month', {
            pageTitle: 'Links for ' + date.format('MMMM') + ', ' + year,
            archiveUrl: 'https://pinboard.in/u:' + user,
            lastMonthUrl: lastMonthUrl,
            nextMonthUrl: nextMonthUrl,
            month: date.format('MMMM'),
            year: date.year(),
            categories: finalCategories
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

