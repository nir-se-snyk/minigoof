var test = require('node:test');
var assert = require('node:assert');
var AdmZip = require('adm-zip');
var fs = require('fs');
var path = require('path');
var app = require('../app');

var server, base;

test.before(function () {
  return new Promise(function (resolve) {
    server = app.listen(0, function () {
      base = 'http://127.0.0.1:' + server.address().port;
      resolve();
    });
  });
});

test.after(function () {
  server.close();
  fs.rmSync(path.join(__dirname, '..', 'uploads'), { recursive: true, force: true });
});

function post(url, body, headers) {
  return fetch(base + url, { method: 'POST', body: body, headers: headers });
}

test('creates a todo and renders markdown', async function () {
  var r = await post('/create', JSON.stringify({ content: '**buy milk**' }), { 'content-type': 'application/json' });
  assert.strictEqual(r.status, 201);
  var html = await (await fetch(base + '/')).text();
  assert.match(html, /<strong>buy milk<\/strong>/);
});

test('does not render raw script tags', async function () {
  await post('/create', JSON.stringify({ content: '<script>alert(1)</script>' }), { 'content-type': 'application/json' });
  var html = await (await fetch(base + '/')).text();
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});

test('merges settings', async function () {
  var r = await post('/settings', JSON.stringify({ theme: 'dark' }), { 'content-type': 'application/json' });
  assert.deepStrictEqual(await r.json(), { theme: 'dark', locale: 'en' });
});

test('imports a benign zip', async function () {
  var zip = new AdmZip();
  zip.addFile('notes.txt', Buffer.from('hello'));
  var r = await post('/import', zip.toBuffer(), { 'content-type': 'application/zip' });
  assert.deepStrictEqual((await r.json()).extracted, ['notes.txt']);
  assert.strictEqual(fs.readFileSync(path.join(__dirname, '..', 'uploads', 'notes.txt'), 'utf8'), 'hello');
});

test('parses a due date', async function () {
  var r = await fetch(base + '/due?date=' + encodeURIComponent('5 March 2026'));
  assert.deepStrictEqual(await r.json(), { due: 'March 5, 2026' });
});

test('admin area is forbidden by default', async function () {
  var r = await fetch(base + '/admin');
  assert.strictEqual(r.status, 403);
});
