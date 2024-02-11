const express = require( "express" );
const app = express();
const cors = require( "cors" );
const bodyParser = require( "body-parser" );
const { ANIME } = require( "@consumet/extensions" );
const zoro = new ANIME.Zoro();

const port = 5260;




const searchAnime = async ( query ) => {
  let results = await zoro.search( query );
  return ( results.results.length ? results : null );
};






app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( cors() );

app.get( "/", ( req, res ) => {
  res.send( "server running!" );
} );

app.post( "/search", async ( req, res ) => {
  const query = req.body.query; // assuming the client sends a 'query' parameter in the request body
  try {
    const searchResults = await searchAnime( query );
    if ( searchResults ) {
      res.json( searchResults ); // sending the search results back to the client
    } else {
      res.status( 404 ).json( { error: "No results found" } );
    }
  } catch ( error ) {
    console.error( "Error searching anime:", error );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );




app.listen( port, () => console.log( `server running on ${ port }` ) );