const express = require( "express" );
const app = express();
const cors = require( "cors" );
const bodyParser = require( "body-parser" );
const { ANIME } = require( "@consumet/extensions" );
const gogo = new ANIME.Gogoanime();
var https = require( "http" );
var server = https.createServer( app );
const port = 5260;




gogo.baseUrl = "https://anitaku.to";

const searchAnime = async ( query ) => {
  let results = await gogo.search( query );
  return ( results.results.length ? results : null );
};

const topAiring = async () => {
  return ( await gogo.fetchTopAiring() );
};

const recentEpisodes = async ( page = 1, type = 1 ) => {
  return ( await gogo.fetchRecentEpisodes( page, type ) );
};

const animeInfo = async ( id ) => {
  return ( await gogo.fetchAnimeInfo( id ) );
};






app.use( bodyParser.json() );
app.use( express.json() );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( cors() );

app.get( "/", ( req, res ) => {
  res.send( "server running!" );
} );


app.post( "/top-airing", async ( req, res ) => {
  try {
    res.json( await topAiring() );
  } catch ( e ) {
    console.log( e );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );


app.post( "/recent-episodes", async ( req, res ) => {

  const page = req.body?.page || 1;
  const type = req.body?.type || 1;

  try {
    res.json( await recentEpisodes( page, type ) );
  } catch ( e ) {
    console.log( e );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );


app.post( "/anime-info", async ( req, res ) => {

  const id = req.body.id;

  try {

    const anime = await animeInfo( id );
    if ( anime ) res.json( anime );
    else res.status( 404 ).json( { error: "Invalid ID" } );

  } catch ( e ) {
    console.log( e );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );


app.post( "/search", async ( req, res ) => {
  const query = req.body.query; // assuming the client sends a 'query' parameter in the request body
  console.log( query );
  console.log( req.body );
  try {
    const searchResults = await searchAnime( query );
    console.log( query );
    if ( searchResults ) {
      console.log( searchResults );
      res.json( searchResults ); // sending the search results back to the client
    } else {
      res.status( 404 ).json( { error: "No results found" } );
    }

  } catch ( error ) {
    console.error( "Error searching anime:", error );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );




server.listen( port, () => console.log( `server running on ${ port }` ) );