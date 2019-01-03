const Blink = require('node-blink-security');
const BlinkCamera = require('node-blink-security');
var express = require('express');
var path = require('path');
var app = express();
var blink;
var tok;
var bodyParser = require('body-parser');
var https = require('https');
var base_url;
var base_host;

app.use(bodyParser.urlencoded({
   extended: false
}));

//app.use(cookieParser);

app.get('/', function (req, res, next)
{
	res.sendFile(__dirname + '/index.html');
});

app.post('/', function (req, res, next)
{
	var emailaddress = req.body.emailaddress;
	var password = req.body.password;
	var syncmod = req.body.syncmod;

	res.writeHead(200, {"Content-Type": "text/html"});
	res.write("<html><head><body>")

	res.write("<h1>Blink - test</h1>");

	blink = new Blink(emailaddress, password);
	blink.setupSystem(syncmod)
    .then(() =>
        {
		tok = blink._auth_header.TOKEN_AUTH;
console.log("TOKEN_AUTH=" + tok);

          var blinkCamera = blink.cameras;

          var ff = blink.idTable;
          var vid = 0;

          console.log("blink="+blink.networkId);

          		res.write("<h3>" + syncmod + "</h3>");

          		res.write("<h3>Cameras:</h3>");

          		res.write("<table>");
          		res.write("<tr>");

				for (var bc in ff)
				{
					vid++;
					if (vid > 4)
					{
		          		res.write("</tr>");
						res.write("<br><br>");
		          		res.write("<tr>");
		          		vid=1;
					}

					console.log(blinkCamera[ff[bc]]._name);
					base_url = blinkCamera[ff[bc]].urls.base_url;
					
					res.write("<td width='20%'>");

				  	res.write("<b>" + blinkCamera[ff[bc]]._name + "</b> (" + blinkCamera[ff[bc]]._id + ")<br>");

					res.write("</td>");
				}

				res.write("</tr>");
				res.write("</table>");

				res.write("<br><br><br>");
          		res.write("<a href='/getVideos?page=1'>getVideoList</a>");
				res.write("<br><br><br>");
          		res.write("<br><a href='/getVideos2?page=1'>getVideoList (beta)</a>");

			res.write("</body></head></html>");
            res.end();

        },
        (error) =>
        {
          	console.log(error);
//			res.writeHead(200,{'Content-Type': 'text/html'});
			res.write("Login failed<br>");
//			res.write("<a href='/'>Ok</a><br>");
			res.end();	
        });
});

var params=function(req){
  let q=req.url.toString().split('?'),result={};

  if(q.length>=2){
      q[1].split('&').forEach((item)=>{
           try {
             result[item.split('=')[0]]=item.split('=')[1];
           } catch (e) {
             result[item.split('=')[0]]='';
           }
      })
  }
  return result;
}


app.get('/getvideos', function (req, res)
{
	var page;
	req.params=params(req);
	console.log("in getVideos");


	page = req.params.page;	
	
	var request = require('request');

	// Set the headers
	var headers = {
		'Cache-Control': 'no-cache',
	    'Host': 'prod.immedia-semi.com',
	    'TOKEN_AUTH': tok
	}

	// Configure the request
	var getvideolurl = base_url + "/api/v2/videos/page/" + page;
	var options = {
		method: 'GET',
	    url: getvideolurl,
	    headers: headers
	}
	console.log("options="+options.url);

	// Start the request
	request(options, function (error, response, body) {
		console.log("err:" + error);
		console.log("response.statusCode:"+response.statusCode);
	    if (!error && response.statusCode == 200) {
	        res.write("<table>");
	        res.write("Page " + page);
	        res.write("</table>");
	        res.write("<br>");

			res.write("<table width=100%>")
			var bodyjson = JSON.parse(body);
			for (var vid in bodyjson)
			{
				res.write('<tr>');
				res.write("<td width=100>" + bodyjson[vid].id + "</td><td width=100>" + bodyjson[vid].created_at + "</td><td width=100>" + bodyjson[vid].camera_name + "</td><td width=100>" + bodyjson[vid].length + " secs</td><td width=100><a href='/downloadVideo?urlpath=" + bodyjson[vid].address + "'>" + bodyjson[vid].address + "</a></td>");
				res.write('</tr>');
			}
			res.write("</table>");
			res.write("<table>");
			res.write("<tr><tr><a href='/getVideos?page=" + (+page+1) + "'>Next page</a>");
			if (page > 1)
			{
				res.write("<br><tr><a href='/getVideos?page=" + (+page-1) + "'>Prev page</a>");				
			}
			res.write("</table>");
			res.end();
		}
		else
		{
			res.write("<table>");
			res.write("<tr><tr>No more!");
			res.write("</table>");
			res.end();
			console.log("err:"+error);
			console.log("err2:"+response.statusCode);
		};
	})

});

app.get('/getvideos2', function (req, res)
{
	var page;
	req.params=params(req);
	console.log("in getVideos2");


	page = req.params.page;	
	
	blink.getVideos(page)
	.then(function(resp)
	{
		//console.log(resp);

		res.write("<table>");
	    res.write("Page " + page);
        res.write("</table>");
        res.write("<br>");
 		res.write("<table width=100%>")
 		for (var vid in resp)
 		{
 			console.log(resp[vid].id);
			res.write('<tr>');
			res.write("<td width=100>" + resp[vid].id + "</td><td width=100>" + resp[vid].created_at + "</td><td width=100>" + resp[vid].camera_name + "</td><td width=100>" + resp[vid].length + " secs</td><td width=100><a href='/downloadVideo?urlpath=" + resp[vid].address + "'>" + resp[vid].address + "</a></td>");
			res.write('</tr>');
 		}
 		res.write("</table>");
		res.write("<table>");
		res.write("<tr><tr><a href='/getVideos2?page=" + (+page+1) + "'>Next page</a>");
		if (page > 1)
		{
			res.write("<br><tr><a href='/getVideos2?page=" + (+page-1) + "'>Prev page</a>");				
		}
		res.write("</table>");
		res.end();

	})
	.catch(function(error) {
	  console.log('Error: ', error);
	});

});	

module.exports = app;