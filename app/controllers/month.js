var _ = require('underscore');
var config = require('config');
var moment = require('moment');
var BookmarkSvc = require('../services/BookmarkSvc');

function _getCategories() {
  return config.get('categories').map(function(cat) {
    return _.extend({ bookmarks: [] }, cat);
  });
}

module.exports = {
  index: function(req, res) {
    var year = req.param('year');
    var month = req.param('month');
    var date = moment([year, month - 1]);

    if (date.isValid()) {
      var categories = _getCategories();

      BookmarkSvc.getByMonth(month, function(err, bookmarks) {
        categories.forEach(function(category) {
          for (var i = 0; i < bookmarks.length; i++) {
            if (_.intersection(bookmarks[i].tags, category.tags).length > 0) {
              category.bookmarks.push(bookmarks[i]);
              // Pull the bookmark out of the list
              // This enforces a pseudo "priority" system
              bookmarks.splice(i--, 1);
            }
          }
        });

        // Toss on the unassigned section for easier formatting
        categories.push({
          title: 'Everything else',
          bookmarks: bookmarks
        });

        // Remove categories without links
        categories = categories.filter(function(section) {
          return section.bookmarks && section.bookmarks.length;
        });

        if (categories.length) {
          res.render('month', {
            pageTitle: 'Links for ' + date.format('MMMM') + ', ' + year,
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

