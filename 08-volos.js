var argo = require('argo');
var express = require('express');
var request = require('request')

var quotaModule = require('volos-quota-memory');

var quota = quotaModule.create({
  timeUnit: 'minute',
  interval: 1,
  allow: 1
});

var app = express();

var proxy = argo()
	.get('/tim/sandbox/books/*', function(handle) {
    handle('response', function(env, next) {
    	quota.apply({ identifier: 'Foo', weight: 1 }, function(err, quota) {
    	  if (quota.isAllowed) {
        	env.target.response.getBody(function(err, usergridBody){
            var usergridObject = JSON.parse(usergridBody.toString());
        		var isbn = usergridObject.entities[0].isbn;
        		request('https://www.googleapis.com/books/v1/volumes?country=us&q=isbn:'+isbn, function(err, result, isbnBody) {
    	      	usergridObject.entities[0]['description'] = JSON.parse(isbnBody).items[0].volumeInfo.description;
    	      	env.response.body = usergridObject;
          		next(env);
          	});
          });    
    	  } else {
    	    env.response.body = "over quota"
    	    next(env);
    	  }
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