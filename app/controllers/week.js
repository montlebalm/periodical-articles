var _ = require('underscore');
var async = require('async');
var config = require('config');
var moment = require('moment');
var BookmarkSvc = require('../services/BookmarkSvc');

var user = process.env.PINBOARD_USER || config.get('pinboard.user');

function _getWeek() {
}

var categories;

module.exports = {
  index: function(req, res) {
    res.render('week', {
      pageTitle: "This is Sparta",
      categories: categories
    });
  }
};

