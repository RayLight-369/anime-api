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
const { ANIME } = require( "@consumet/extensions" );
var https = require( "http" );
var server = https.createServer( app );

// const ajaxUrl = "https://ajax.gogo-load.com/ajax";
// const baseUrl = "https://anitaku.to";

const gogo = new ANIME.Gogoanime();

gogo.fetchAnimeInfo = fetchAnimeInfo.bind( gogo );
gogo.fetchTopAiring = fetchTopAiring.bind( gogo );
gogo.fetchRecentEpisodes = fetchRecentEpisodes.bind( gogo );

const torrentGalaxy = require( './torrent/torrentGalaxy' );
const limeTorrent = require( './torrent/limeTorrent' );

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const port = 5260;
let cachedValue = 0;
const supabase = createClient( supabaseUrl, supabaseKey );


gogo.baseUrl = "https://anitaku.to";


async function fetchRecentEpisodes ( page = 1, type = 1 ) {
  try {
    const res = await this.client.get( `${ this.baseUrl }/page-recent-release.html?page=${ page }&type=${ type }` );
    const $ = ( 0, cheerio_1.load )( res.data );
    const recentEpisodes = [];
    $( 'div.last_episodes.loaddub > ul > li' ).each( ( i, el ) => {
      var _a, _b, _c, _d;
      recentEpisodes.push( {
        id: ( _b = ( _a = $( el ).find( 'a' ).attr( 'href' ) ) === null || _a === void 0 ? void 0 : _a.split( '/' )[ 1 ] ) === null || _b === void 0 ? void 0 : _b.split( '-episode' )[ 0 ],
        episodeId: ( _c = $( el ).find( 'a' ).attr( 'href' ) ) === null || _c === void 0 ? void 0 : _c.split( '/' )[ 1 ],
        episodeNumber: parseInt( $( el ).find( 'p.episode' ).text().replace( 'Episode ', '' ) ),
        title: $( el ).find( 'p.name > a' ).attr( 'title' ),
        image: $( el ).find( 'div > a > img' ).attr( 'src' ),
        url: `${ this.baseUrl }${ ( _d = $( el ).find( 'a' ).attr( 'href' ) ) === null || _d === void 0 ? void 0 : _d.trim() }`,
      } );
    } );
    const hasNextPage = !$( 'div.anime_name_pagination.intro > div > ul > li' ).last().hasClass( 'selected' );
    return {
      currentPage: page,
      hasNextPage: hasNextPage,
      results: recentEpisodes,
    };
  }
  catch ( err ) {
    throw new Error( 'Something went wrong. Please try again later.' );
  }
};

async function fetchTopAiring ( page = 1 ) {
  try {
    const res = await this.client.get( `${ this.baseUrl }/page-recent-release-ongoing.html?page=${ page }` );
    const $ = ( 0, cheerio_1.load )( res.data );
    const topAiring = [];
    console.log( "point 1: " );
    $( 'div.added_series_body.popular > ul > li' ).each( ( i, el ) => {
      var _a, _b;
      console.log( "point 2: " );
      var obj = {
        id: ( _a = $( el ).find( 'a:nth-child(1)' ).attr( 'href' ) ) === null || _a === void 0 ? void 0 : _a.split( '/' )[ 2 ],
        title: $( el ).find( 'a:nth-child(1)' ).attr( 'title' ),
        image: ( _b = $( el ).find( 'a:nth-child(1) > div' ).attr( 'style' ) ) === null || _b === void 0 ? void 0 : _b.match( '(https?://.*.(?:png|jpg))' )[ 0 ],
        url: `${ this.baseUrl }${ $( el ).find( 'a:nth-child(1)' ).attr( 'href' ) }`,
        genres: $( el )
          .find( 'p.genres > a' )
          .map( ( i, el ) => $( el ).attr( 'title' ) )
          .get(),
      };
      console.log( obj );
      topAiring.push( obj );
    } );
    const hasNextPage = !$( 'div.anime_name.comedy > div > div > ul > li' ).last().hasClass( 'selected' );
    return {
      currentPage: page,
      hasNextPage: hasNextPage,
      results: topAiring,
    };
  }
  catch ( err ) {
    throw new Error( 'Something went wrong. Please try again later.' );
  }
};

async function fetchAnimeInfo ( id ) {
  if ( !id.includes( 'gogoanime' ) )
    id = `${ this.baseUrl }/category/${ id }`;
  const animeInfo = {
    id: '',
    title: '',
    url: '',
    genres: [],
    totalEpisodes: 0,
  };

  // try {
  const res = await this.client.get( id );
  const $ = ( 0, cheerio_1.load )( res.data );
  animeInfo.id = new URL( id ).pathname.split( '/' )[ 2 ];
  animeInfo.title = $( 'section.content_left > div.main_body > div:nth-child(2) > div.anime_info_body_bg > h1' )
    .text()
    .trim();
  animeInfo.url = id;
  animeInfo.image = $( 'div.anime_info_body_bg > img' ).attr( 'src' );
  animeInfo.releaseDate = $( 'div.anime_info_body_bg > p:nth-child(8)' )
    .text()
    .trim()
    .split( 'Released: ' )[ 1 ];
  animeInfo.description = $( 'div.anime_info_body_bg > div.description' )
    .text()
    .trim()
    .replace( 'Plot Summary: ', '' );
  animeInfo.subOrDub = animeInfo.title.toLowerCase().includes( 'dub' ) ? "dub" : "sub";
  animeInfo.type = $( 'div.anime_info_body_bg > p:nth-child(4) > a' )
    .text()
    .trim()
    .toUpperCase();
  animeInfo.status = "Unknown";
  switch ( $( 'div.anime_info_body_bg > p:nth-child(9) > a' ).text().trim() ) {
    case 'Ongoing':
      animeInfo.status = "Ongoing";
      break;
    case 'Completed':
      animeInfo.status = "Completed";
      break;
    case 'Upcoming':
      animeInfo.status = "Not yet aired";
      break;
    default:
      animeInfo.status = "Unknown";
      break;
  }
  animeInfo.otherName = $( 'div.anime_info_body_bg > p.other-name' )
    .text()
    .replace( 'Other name: ', '' )
    .replace( /;/g, ',' );
  $( 'div.anime_info_body_bg > p:nth-child(7) > a' ).each( ( i, el ) => {
    var _a;
    ( _a = animeInfo.genres ) === null || _a === void 0 ? void 0 : _a.push( $( el ).attr( 'title' ).toString() );
  } );

  const ep_start = $( '#episode_page > li' ).first().find( 'a' ).attr( 'ep_start' );
  const ep_end = $( '#episode_page > li' ).last().find( 'a' ).attr( 'ep_end' );
  const movie_id = $( '#movie_id' ).attr( 'value' );
  const alias = $( '#alias_anime' ).attr( 'value' );
  const html = await this.client.get( `${ this.ajaxUrl }/load-list-episode?ep_start=${ ep_start }&ep_end=${ ep_end }&id=${ movie_id }&default_ep=${ 0 }&alias=${ alias }` );
  const $$ = ( 0, cheerio_1.load )( html.data );
  animeInfo.episodes = [];

  $$( '#episode_related > li' ).each( ( i, el ) => {
    var _a, _b, _c;
    ( _a = animeInfo.episodes ) === null || _a === void 0 ? void 0 : _a.push( {
      id: ( _b = $( el ).find( 'a' ).attr( 'href' ) ) === null || _b === void 0 ? void 0 : _b.split( '/' )[ 1 ],
      number: parseFloat( $( el ).find( `div.name` ).text().replace( 'EP ', '' ) ),
      url: `${ this.baseUrl }/${ ( _c = $( el ).find( `a` ).attr( 'href' ) ) === null || _c === void 0 ? void 0 : _c.trim() }`,
    } );
  } );
  animeInfo.episodes = animeInfo.episodes.reverse();
  animeInfo.totalEpisodes = parseInt( ep_end !== null && ep_end !== void 0 ? ep_end : '0' );
  return animeInfo;
  // }
  // catch ( err ) {
  //   throw new Error( `failed to fetch anime info: ${ err }` );
  // }
};



async function updateCachedValue ( update ) {
  try {
    const Data = supabase
      .from( 'sp' );

    if ( update && cachedValue > 10 ) {
      await Data
        .update( { viewers: cachedValue } )
        .match( { id: 1 } );
    }

    const { data, error } = await Data.select();
    // console.log( data );

    if ( error ) {
      throw error;
    }

    if ( data.length === 0 ) {
      throw new Error( 'No rows found' );
    }

    if ( !update ) cachedValue = parseInt( data[ 0 ].viewers );
  } catch ( error ) {
    console.error( 'Error fetching value from Supabase:', error );
  }
}

updateCachedValue( false );

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
    console.log( data );
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


app.post( "/episode-servers", async ( req, res ) => {
  const id = req.body.epId;

  try {
    const servers = await fetchServers( id );

    if ( servers ) {
      ////console.log( servers );
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


app.get( "/num-of-viewers", async ( _, res ) => {
  try {

    console.log( cachedValue );
    // const count = parseInt( ( await fs.readFile( "torrent/count.txt", "utf8" ) ).toString() );
    res.status( 200 ).json( { count: cachedValue } );

  } catch ( e ) {
    console.log( e );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );


app.post( "/num-of-viewers", ( req, res ) => {

  const visited = req.body.visited;

  try {

    if ( !visited || visited == "null" ) {
      ++cachedValue;
      res.cookie( "deviceVisited", true );
      // console.log( cachedValue );
    }

    res.status( 200 ).json( { count: cachedValue } );

  } catch ( e ) {
    //console.log( e );
    res.status( 500 ).json( { error: "Internal server error" } );
  }
} );


app.post( "/torrents", async ( req, res ) => {

  res.header( "Access-Control-Allow-Origin", "*" );
  res.header( "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" );
  // let website = ( req.params.website ).toLowerCase();
  const query = req.body?.query || "";
  const category = req.body?.category || "all";
  const page = req?.body?.page || 1;

  // limeTorrent( query, page, category )
  //   .then( ( data ) => {
  //     if ( data === null ) {
  //       return res.json( {
  //         error: 'Website is blocked change IP'
  //       } );

  //     } else {
  //       return res.send( data );
  //     }
  //   } );

  torrentGalaxy( query, page, category )
    .then( ( data ) => {
      if ( data === null ) {
        return res.json( {
          error: 'Website is blocked change IP'
        } );

      } else {
        return res.send( data );
      }

    } );




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






setInterval( () => updateCachedValue( true ), 30000 );



server.listen( port, () => console.log( `server running on ${ port }` ) );
