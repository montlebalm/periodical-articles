var _ = require('underscore');
var async = require('async');
var config = require('config');
var moment = require('moment');
var BookmarkSvc = require('../services/BookmarkSvc');

var user = process.env.PINBOARD_USER || config.get('pinboard.user');

var startOfWeek = moment().startOf('week');
var endOfWeek = moment().endOf('week');

function _getCategories() {
  return config.get('categories').map(function(cat) {
    return _.extend({ bookmarks: [] }, cat);
  });
}

module.exports = {
  index: function(req, res) {
    var categories = _getCategories();

    async.parallel({
      bookmarks: function(next) {
        BookmarkSvc.getPostsForWeek(startOfWeek, endOfWeek, next);
      }
    }, function(err, results) {

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

        categories.push({
          title: 'Everything else',
          bookmarks: results.bookmarks
        });

        categories = categories.filter(function(section) {
          return section.bookmarks && section.bookmarks.length;
        });

        if (categories.length) {
          res.render('week', {
            pageTitle: "This Week in Links",
            start: startOfWeek.format("MMM Do YYYY"),
            end: endOfWeek.format("MMM Do YYYY"),
            bookmarks: results.bookmarks,
            categories: categories
          });
        }
    });
  }
};

