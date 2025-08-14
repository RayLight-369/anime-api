require( "dotenv" ).config();

const express = require( "express" );
const { createClient } = require( '@supabase/supabase-js' );
const fs = require( "fs/promises" );
const TorrentSearchApi = require( "torrent-search-api" );
const cheerio_1 = require( "cheerio" );
const app = express();
TorrentSearchApi.enableProvider( "Yts" );
const cors = require( "cors" );
const bodyParser = require( "body-parser" );
// const { ANIME } = require( "@consumet/extensions" );
var https = require( "http" );
var server = https.createServer( app );

// const ajaxUrl = "https://ajax.gogo-load.com/ajax";
// const baseUrl = "https://anitaku.to";

// const gogo = new ANIME.Gogoanime();

// gogo.fetchAnimeInfo = fetchAnimeInfo.bind( gogo );
// gogo.fetchTopAiring = fetchTopAiring.bind( gogo );
// gogo.fetchRecentEpisodes = fetchRecentEpisodes.bind( gogo );

const torrentGalaxy = require( './torrent/torrentGalaxy' );
const limeTorrent = require( './torrent/limeTorrent' );

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const port = 5260;
let cachedValue = 0;
const supabase = createClient( supabaseUrl, supabaseKey );


// gogo.baseUrl = "https://anitaku.io";

async function s( query = 'attack on', page = 1 ) {
  const response = await fetch( 'http://localhost:4000/api/v2/hianime/search?q=' + query + '&page=' + page );
  const body = await response.json();
  const results = body.data.animes.map( ( anime ) => ( {
    id: anime.id,
    title: anime.name,
    image: anime.poster,
    url: `http://localhost:4000/api/v2/hianime/anime/${ anime.id }`,
    genres: [],
  } ) );


  const res = {
    hasNextPage: body.data.hasNextPage,
    currentPage: body.data.currentPage,
    results
  };

  // console.log( res );

}

s();
async function search( query, page = 1 ) {
  const response = await fetch( 'http://localhost:4000/api/v2/hianime/search?q=' + query + '&page=' + page );
  const body = await response.json();
  const results = body.data.animes.map( ( anime ) => ( {
    id: anime.id,
    title: anime.name,
    image: anime.poster,
    url: `http://localhost:4000/api/v2/hianime/anime/${ anime.id }`,
    genres: [],
  } ) );


  const res = {
    hasNextPage: body.data.hasNextPage,
    currentPage: body.data.currentPage,
    results
  };

  return res;
}
async function fetchRecentEpisodes( page = 1, type = 1 ) {
  try {
    const response = await fetch( 'http://localhost:4000/api/v2/hianime/category/recently-updated?page=' + page );
    const body = await response.json();
    const latestUpdated = body.data.animes.map( ( anime ) => ( {
      id: anime.id,
      title: anime.name,
      image: anime.poster,
      url: `http://localhost:4000/api/v2/hianime/anime/${ anime.id }`,
      episodeNumber: anime.episodes.sub,
      episodeId: 0
    } ) );

    return {
      hasNextPage: body.data.hasNextPage,
      currentPage: body.data.currentPage,
      results: latestUpdated
    };
  }
  catch ( err ) {
    throw new Error( 'Something went wrong. Please try again later.' );
  }
};

async function fetchTopAiring( page = 1 ) {
  try {
    const response = await fetch( 'http://localhost:4000/api/v2/hianime/category/top-airing?page=' + page );
    const body = await response.json();
    console.log( body );
    const topAiring = body.data.animes.map( ( anime ) => ( {
      id: anime.id,
      title: anime.name,
      image: anime.poster,
      url: `http://localhost:4000/api/v2/hianime/anime/${ anime.id }`,
      genres: [],
    } ) );

    return {
      hasNextPage: body.data.hasNextPage,
      currentPage: body.data.currentPage,
      results: topAiring
    };
  }
  catch ( err ) {
    throw new Error( 'Something went wrong. Please try again later.' );
  }
};

async function fetchAnimeInfo( id ) {
  const response = await fetch( 'http://localhost:4000/api/v2/hianime/anime/' + id );
  const body = await response.json();
  const info = body.data.anime.info;
  const moreInfo = body.data.anime.moreInfo;

  const animeInfo = {
    id: id,
    title: info.name,
    url: id,
    genres: moreInfo.genres,
    totalEpisodes: info.stats.episodes.sub,
    releaseDate: moreInfo.aired,
    description: info.description,
    image: info.poster,
    status: moreInfo.status,
    type: info.stats.type,
    otherNames: `${ moreInfo.japanese } ${ moreInfo.synonyms }`.replace( / /g, ', ' )
  };
  // console.log( animeInfo );
  return animeInfo;

};



// async function updateCachedValue( update ) {
//   try {
//     const Data = supabase
//       .from( 'sp' );

//     if ( update && cachedValue > 10 ) {
//       await Data
//         .update( { viewers: cachedValue } )
//         .match( { id: 1 } );
//     }

//     const { data, error } = await Data.select();
//     // console.log( data );

//     if ( error ) {
//       throw error;
//     }

//     if ( data.length === 0 ) {
//       throw new Error( 'No rows found' );
//     }

//     if ( !update ) cachedValue = parseInt( data[ 0 ].viewers );
//   } catch ( error ) {
//     console.error( 'Error fetching value from Supabase:', error );
//   }
// }

// updateCachedValue( false );

const searchAnime = async ( query, page = 1 ) => {
  let results = await search( query, page );
  return ( results.results.length ? results : null );
};

const topAiring = async ( page = 1 ) => {
  return ( await fetchTopAiring( page ) );
};

const recentEpisodes = async ( page = 1, type = 1 ) => {
  return ( await fetchRecentEpisodes( page, type ) );
};

const animeInfo = async ( id ) => {
  return ( await fetchAnimeInfo( id ) );
};

const fetchServers = async ( id ) => {
  return ( await gogo.fetchEpisodeServers( id ) );
};

const fetchTorrents = async ( query, category = "all" ) => {
  return ( await TorrentSearchApi.search( query, category ) );
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
    const data = await topAiring( page );
    // console.log( data );
    res.json( data );
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
    ////console.log( e );
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
    // console.log( e );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );


// app.post( "/episode-servers", async ( req, res ) => {
//   const id = req.body.epId;

//   try {
//     const servers = await fetchServers( id );

//     if ( servers ) {
//       ////console.log( servers );
//       res.json( servers ); // sending the search results back to the client
//     } else {
//       res.status( 404 ).json( { error: "No results found" } );
//     }

//   } catch ( error ) {
//     console.error( "Error searching anime:", error );
//     res.status( 500 ).json( { error: "Internal server error" } );
//   }
// } );


app.post( "/search", async ( req, res ) => {
  const query = req.body.query; // assuming the client sends a 'query' parameter in the request body
  const page = req.body.page || 1;

  try {
    const searchResults = await searchAnime( query, page );
    // console.log( query );
    if ( searchResults ) {
      //console.log( searchResults );
      res.json( searchResults ); // sending the search results back to the client
    } else {
      res.status( 404 ).json( { error: "No results found" } );
    }

  } catch ( error ) {
    console.error( "Error searching anime:", error );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );


// app.get( `/num-of-viewers`, async ( _, res ) => {
//   try {

//     console.log( cachedValue );
//     // const count = parseInt( ( await fs.readFile( "torrent/count.txt", "utf8" ) ).toString() );
//     res.status( 200 ).json( { count: cachedValue } );

//   } catch ( e ) {
//     console.log( e );
//     res.status( 500 ).json( { error: "Internal server error" } );
//   }
// } );


// app.post( "/num-of-viewers", ( req, res ) => {

//   const visited = req.body.visited;

//   try {

//     if ( !visited || visited == "null" ) {
//       ++cachedValue;
//       res.cookie( "deviceVisited", true );
//       // console.log( cachedValue );
//     }

//     res.status( 200 ).json( { count: cachedValue } );

//   } catch ( e ) {
//     //console.log( e );
//     res.status( 500 ).json( { error: "Internal server error" } );
//   }
// } );


app.post( "/torrents", async ( req, res ) => {

  res.header( "Access-Control-Allow-Origin", "*" );
  res.header( "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" );
  // let website = ( req.params.website ).toLowerCase();
  const query = req.body?.query || "";
  const category = req.body?.category || "all";
  const page = req?.body?.page || 1;

  const limeTorrents = await limeTorrent( query, page, category );

  const tgx = await torrentGalaxy( query, page, category );

  if ( limeTorrents && limeTorrents.torrents.length ) {
    res.send( limeTorrents );
  } else if ( tgx && tgx.torrents.length ) {
    res.send( tgx );
  } else {
    res.end();
  }

  // torrentGalaxy( query, page, category )
  //   .then( ( data ) => {
  //     if ( data === null ) {
  //       return res.json( {
  //         error: 'Website is blocked change IP'
  //       } );

  //     } else {
  //       return res.send( data );
  //     }

  //   } );




  // const query = req.body.query;

  // try {

  //   const torrents = await fetchTorrents( query, category );

  //   if ( torrents ) res.json( { torrents } );
  //   else res.status( 404 ).json( { error: "Not Found" } );

  // } catch ( e ) {
  //   console.log( e );
  //   res.status( 500 ).json( { error: "Internal Server Error" } );
  // }
} );






// setInterval( () => updateCachedValue( true ), 30000 );



server.listen( port, () => console.log( `server running on ${ port }` ) );
