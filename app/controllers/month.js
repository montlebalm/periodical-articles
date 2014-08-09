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
      var unassigned = [];

      BookmarkSvc.getByMonth(month, function(err, bookmarks) {
        // Assign bookmarks to categories by tags
        for (var i = 0; i < bookmarks.length; i++) {
          var bm = bookmarks[i];

          categories.forEach(function(cat) {
            if (_.intersection(bm.tags, cat.tags).length > 0) {
              cat.bookmarks.push(bm);
              // Pull the bookmark out of the list
              // This enforces a pseudo "priority" system
              bookmarks.splice(i--, 1);
            }
          });
        }

        // Toss on the unassigned section for easier formatting
        categories.push({
          title: 'Unassigned',
          bookmarks: unassigned
        });

        // Remove categories without links
        categories = categories.filter(function(section) {
          return section.bookmarks && section.bookmarks.length;
        });

        res.render('month', {
          pageTitle: 'Links for ' + date.format('MMMM') + ', ' + year,
          month: date.format('MMMM'),
          year: date.year(),
          categories: categories
        });
      });
    } else {
      res.send(404);
    }
  }
};

