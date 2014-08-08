'use strict';

var async = require('async');
var config = require('config');
var request = require('request');
var moment = require('moment');

var baseUrl = config.get('pinboard.base_url');
var user = process.env.PINBOARD_USER || config.get('pinboard.user');
var apiKey = process.env.PINBOARD_TOKEN || config.get('pinboard.api_key');

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

function getAllPosts(callback) {
  request(_getUrl('posts/all'), function(err, res, body) {
    if (err) {
      return callback(err);
    }

    callback(null, JSON.parse(body));
  });
}

module.exports = {
  getByMonth: function(month, callback) {
    getAllPosts(function(err, data) {
      if (err) {
        return callback(err);
      }

      var filtered = data.map(_deriveBookmark).filter(function(b) {
        return b.timestamp.getMonth() + 1 == month;
      });

      callback(null, filtered);
    });
  }
};

