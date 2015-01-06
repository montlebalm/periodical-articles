module.exports = {
  index: function(req, res, next) {
    res.status(404);

    // Respond with html page
    if (req.accepts('html')) {
      return res.render('404', {
        pageTitle: 'Not found'
      });
    }

    // Respond with json
    if (req.accepts('json')) {
      return res.send({ error: 'Not found' });
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
  }
};
