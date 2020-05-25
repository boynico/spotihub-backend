/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '4c7f2950c897477ab9e298e92c512736'; // Your client id
var client_secret = 'a7184257062b4d9e879315fe9a1b1db8'; // Your secret
var redirect_uri = 'http://192.168.1.108:8888/callback'; // Your redirect uri

/********/
var access_token;
var refresh_token;
/********/

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-top-read user-read-recently-played user-read-currently-playing user-library-read user-read-private user-read-email playlist-read-collaborative playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token;
        refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


//aquí mis métodos-------------------------------------------------------

app.get('/getTopArtists', function (req, res){
  var options = {
    url: 'https://api.spotify.com/v1/me/top/artists?limit=25',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});


app.get('/getSavedAlbums', function (req, res){
  var options = {
    url: 'https://api.spotify.com/v1/me/albums',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/getUserData', function (req, res){
  var options = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/getTopTracks', function (req, res){
  var options = {
    url: 'https://api.spotify.com/v1/me/top/tracks?limit=45',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/getRecentlyPlayed', function (req, res){
  var options = {
    url: 'https://api.spotify.com/v1/me/player/recently-played?limit=45',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/getPlaylists', function (req, res){
  var options = {
    url: 'https://api.spotify.com/v1/me/playlists',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/getArtist', function (req, res){
  var idArtist = req.query.id
  var options = {
    url: 'https://api.spotify.com/v1/artists/' + idArtist,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/getArtistRelatedArtists', function (req, res){
  var idArtist = req.query.id
  var options = {
    url: 'https://api.spotify.com/v1/artists/' + idArtist + '/related-artists',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/getUser', function (req, res){
  var idUser = req.query.id
  var options = {
    url: 'https://api.spotify.com/v1/users/' + idUser,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});




app.get('/getArtistTopTracks', function (req, res){
  var idArtist = req.query.id
  var options = {
    url: 'https://api.spotify.com/v1/artists/' + idArtist + '/top-tracks?country=ES',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/getArtistAlbums', function (req, res){
  var idArtist = req.query.id
  var options = {
    url: 'https://api.spotify.com/v1/artists/' + idArtist + '/albums?include_groups=album&limit=36&country=ES',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/getArtistSingles', function (req, res){
  var idArtist = req.query.id
  var options = {
    url: 'https://api.spotify.com/v1/artists/' + idArtist + '/albums?include_groups=single&limit=36&country=ES',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});


app.get('/searchAlbum', function (req, res){
  var stringAlbum = req.query.stringAlbum
  var options = {
    url: 'https://api.spotify.com/v1/search?q=' + stringAlbum + '&type=album',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});
app.get('/searchArtist', function (req, res){
  var stringArtist = req.query.stringArtist
  var options = {
    url: 'https://api.spotify.com/v1/search?q=' + stringArtist + '&type=artist',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});

app.get('/searchTrack', function (req, res){
  var stringTrack = req.query.stringTrack
  var options = {
    url: 'https://api.spotify.com/v1/search?q=' + stringTrack + '&type=track',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.send(body);
  });
});
console.log('Listening on 8888');
app.listen(8888);
