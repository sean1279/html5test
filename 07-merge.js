var argo = require('argo');
var express = require('express');
var request = require('request')

var app = express();

var proxy = argo()
	.get('/tim/sandbox/books/*', function(handle) {
    handle('response', function(env, next) {
    	env.target.response.getBody(function(err, usergridBody){
        var usergridObject = JSON.parse(usergridBody.toString());
    		var isbn = usergridObject.entities[0].isbn;
    		request('https://www.googleapis.com/books/v1/volumes?country=us&q=isbn:'+isbn, function(err, result, isbnBody) {
	      	usergridObject.entities[0]['description'] = JSON.parse(isbnBody).items[0].volumeInfo.description;
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