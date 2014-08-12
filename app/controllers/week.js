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

module.exports = {
  index: function(req, res) {
    var categories = _getCategories();
    var startOfWeek = moment().startOf('week');
    var endOfWeek = moment().endOf('week');

    async.parallel({
      categories: function(next) {
        BookmarkSvc.getPostsForDateRange(startOfWeek.toDate(), endOfWeek.toDate(), function(err, bookmarks) {
          BookmarkSvc.groupBookmarksByCategory(bookmarks, categories, next);
        });
      }
    }, function(err, results) {
        var finalCategories = results.categories.filter(function(section) {
          return section.bookmarks && section.bookmarks.length;
        });

        if (finalCategories.length) {
          res.render('week', {
            pageTitle: "This Week in Links",
            start: startOfWeek.format("MMM Do YYYY"),
            end: endOfWeek.format("MMM Do YYYY"),
            bookmarks: results.bookmarks,
            categories: finalCategories
          });
        }
    });
  }
};

