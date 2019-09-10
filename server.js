var url  = require('url'),
    http = require('http'),
    fs   = require('fs'),
    express = require('express'),
    app = express.createServer(),
    https = require('https'),
    qs   = require('querystring');

// Load config defaults from JSON file.
// Environment variables override defaults.
var config = JSON.parse(fs.readFileSync(__dirname+ '/config.json.example', 'utf-8'));
for (var i in config) {
  config[i] = process.env[i.toUpperCase()] || config[i];
}

function authenticate(code, cb) {
  var data = qs.stringify({
    client_id: config.client_id,
    client_secret: config.client_secret,
    code: code
  });

  var reqOptions = {
    host: "github.com",
    port: 443,
    path: "/login/oauth/access_token",
    method: "POST",
    headers: { 'content-length': data.length }
  };

  var body = "";
  var req = https.request(reqOptions, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) { body += chunk; });
    res.on('end', function() {
      cb(null, qs.parse(body).access_token);
    });
  });

  req.write(data);
  req.end();
  req.on('error', function(e) { cb(e.message); });
}


// Convenience for allowing CORS on routes - GET only
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS'); 
  res.header('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');
  next();
});


app.get('/authenticate/:code', function(req, res) {
  console.log('autenticating code...' + req.params.code);
  authenticate(req.params.code, function(err, token) {
    err || !token ? res.json({"error": "bad_code"}) : res.json({ "token": token });
  });
});

const port = process.env.PORT || 9000;
app.listen(port, null, function (err) {
  console.log('Gatekeeper, at your service: http://localhost:' + port);
});
