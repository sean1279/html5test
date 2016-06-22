var argo = require('argo');
var express = require('express');
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'myapp'
});

var app = express();

var proxy = argo()
	.get('/tim/sandbox/books/*', function(handle) {
    handle('response', function(env, next) {
    	env.target.response.getBody(function(err, usergridBody){
        var usergridObject = JSON.parse(usergridBody.toString());
    		var isbn = usergridObject.entities[0].isbn;
    		connection.query('SELECT * FROM books WHERE isbn = ?;', [isbn], function(err, rows, fields) {
          if (err) throw err;
          usergridObject.entities[0]['description'] = rows[0].description;
          env.response.body = usergridObject;
          next(env);
        });
      });    	
    });
  })
  .target('https://api.usergrid.com')
  .build();

app.get('/hello', function(req, res) {
    res.send('Hello from Express');
});

app.all('*', proxy.run);

app.listen(3000);