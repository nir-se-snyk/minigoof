var path = require('path');
var express = require('express');
var _ = require('lodash');
var marked = require('marked');
var moment = require('moment');
var AdmZip = require('adm-zip');

var app = express();
app.use(express.json());

var todos = [];
var defaultSettings = { theme: 'light', locale: 'en' };

marked.setOptions({ sanitize: true });

app.get('/', function (req, res) {
  var items = todos.map(function (t) {
    return '<li>' + marked(t.content) + ' <small>' + moment(t.created).fromNow() + '</small></li>';
  });
  res.send('<h1>Minigoof TODO</h1><ul>' + items.join('') + '</ul>');
});

app.post('/create', function (req, res) {
  var todo = { id: todos.length + 1, content: String(req.body.content || ''), created: Date.now() };
  todos.push(todo);
  res.status(201).json(todo);
});

// lodash: prototype pollution via merge of user-controlled JSON
app.post('/settings', function (req, res) {
  var settings = _.merge({}, defaultSettings, req.body);
  res.json(settings);
});

// impact of the pollution above: every object inherits isAdmin
app.get('/admin', function (req, res) {
  var user = {};
  if (user.isAdmin) return res.send('admin area');
  res.status(403).send('forbidden');
});

// adm-zip: zip slip when extracting an uploaded archive
app.post('/import', express.raw({ type: 'application/zip', limit: '5mb' }), function (req, res) {
  var zip = new AdmZip(req.body);
  var target = path.join(__dirname, 'uploads');
  zip.extractAllTo(target, true);
  res.json({ extracted: zip.getEntries().map(function (e) { return e.entryName; }) });
});

// moment: ReDoS on date parsing and path traversal via locale name
app.get('/due', function (req, res) {
  if (req.query.lang) moment.locale(String(req.query.lang));
  var due = moment(String(req.query.date || ''), 'D MMMM YYYY');
  res.json({ due: due.isValid() ? due.format('LL') : null });
});

if (require.main === module) {
  var port = process.env.PORT || 3001;
  app.listen(port, function () {
    console.log('minigoof listening on port ' + port);
  });
}

module.exports = app;
