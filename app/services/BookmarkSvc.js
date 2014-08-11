var _ = require('underscore');
var config = require('config');
var moment = require('moment');
var request = require('request');

var baseUrl = config.get('pinboard.base_url');
var user = process.env.PINBOARD_USER || config.get('pinboard.user');
var apiKey = process.env.PINBOARD_TOKEN || config.get('pinboard.api_key');
var requiredTags = config.get('required_tags');

function _getUrl(suffix) {
  var delim = (suffix.indexOf('?') === -1) ? '?' : '&';
  return [baseUrl, suffix, delim, 'auth_token=', user, ':', apiKey, '&format=json'].join('');
}

function _deriveBookmark(raw) {
  return {
    description: raw.extended,
    tags: raw.tags.split(' '),
    timestamp: new Date(raw.time),
    title: raw.description,
    url: raw.href
  };
}

function _getPostsForMonth(year, month, callback) {
  request({
    url: _getUrl('posts/all'),
    qs: {
      fromdt: moment([year, month - 1]).toDate(),
      todt: moment([year, month]).subtract('days', 1).toDate()
    }
  }, function(err, res, body) {
    if (err) {
      return callback(err);
    }

    // Make sure every returned post has the required tag(s)
    var posts = JSON.parse(body).map(_deriveBookmark);

    if (requiredTags.length) {
      posts = posts.filter(function(bookmark) {
        return _.intersection(requiredTags, bookmark.tags).length > 0;
      });
    }

    callback(null, posts);
  });
}

function _hasPostsInMonth(year, month, callback) {
  request(_getUrl('posts/dates'), function(err, res, body) {
    if (err) {
      return callback(err);
    }

    year = parseInt(year);
    month = parseInt(month) + 1;

    for (var date in JSON.parse(body).dates) {
      var parts = date.split('-');

      if (parts.length === 3 && parseInt(parts[0]) == year && parseInt(parts[1]) == month) {
        return callback(null, true);
      }
    }

    return callback(null, false);
  });
}

module.exports = {
  getByMonth: function(year, month, callback) {
    _getPostsForMonth(year, month, callback);
  },
  hasPostsInMonth: function(year, month, callback) {
    _hasPostsInMonth(year, month, callback);
  }
};

