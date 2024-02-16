require( "dotenv" ).config();

const express = require( "express" );
const { createClient } = require( '@supabase/supabase-js' );
const fs = require( "fs/promises" );
const app = express();
const cors = require( "cors" );
const bodyParser = require( "body-parser" );
const { ANIME } = require( "@consumet/extensions" );
var https = require( "http" );
var server = https.createServer( app );
const gogo = new ANIME.Gogoanime();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const port = 5260;
let cachedValue = 10;
const supabase = createClient( supabaseUrl, supabaseKey );


gogo.baseUrl = "https://anitaku.to";


async function updateCachedValue () {
  try {
    const { data, error } = await supabase
      .from( 'sp' )
      .update( { viewers: cachedValue } )
      .eq( 'id', 1 )
      .select();

    if ( error ) {
      throw error;
    }

    if ( data.length === 0 ) {
      throw new Error( 'No rows found' );
    }

    cachedValue = parseInt( data[ 0 ].viewers );
  } catch ( error ) {
    console.error( 'Error fetching value from Supabase:', error );
  }
}

updateCachedValue();

setInterval( updateCachedValue, 60000 );


const searchAnime = async ( query, page = 1 ) => {
  let results = await gogo.search( query, page );
  return ( results.results.length ? results : null );
};

const topAiring = async ( page = 1 ) => {
  return ( await gogo.fetchTopAiring( page ) );
};

const recentEpisodes = async ( page = 1, type = 1 ) => {
  return ( await gogo.fetchRecentEpisodes( page, type ) );
};

const animeInfo = async ( id ) => {
  return ( await gogo.fetchAnimeInfo( id ) );
};

const fetchServers = async ( id ) => {
  return ( await gogo.fetchEpisodeServers( id ) );
};






app.use( bodyParser.json() );
app.use( express.json() );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( cors() );

app.get( "/", ( req, res ) => {
  res.send( "server running!" );
} );


app.post( "/top-airing", async ( req, res ) => {
  const page = req.body?.page || 1;
  try {
    res.json( await topAiring( page ) );
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


app.post( "/episode-servers", async ( req, res ) => {
  const id = req.body.epId;

  try {
    const servers = await fetchServers( id );

    if ( servers ) {
      console.log( servers );
      res.json( servers ); // sending the search results back to the client
    } else {
      res.status( 404 ).json( { error: "No results found" } );
    }

  } catch ( error ) {
    console.error( "Error searching anime:", error );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );


app.post( "/search", async ( req, res ) => {
  const query = req.body.query; // assuming the client sends a 'query' parameter in the request body
  const page = req.body.page || 1;

  try {
    const searchResults = await searchAnime( query, page );
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


app.get( "/num-of-viewers", async ( _, res ) => {
  try {

    res.sendStatus( 200 ).send( cachedValue );

  } catch ( e ) {
    console.log( e );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );




server.listen( port, () => console.log( `server running on ${ port }` ) );