const cheerio = require( 'cheerio' );
const axios = require( 'axios' );

async function torrentGalaxy ( query = '', page = '0', Category ) {

    if ( page !== '0' ) {
        try {
            page = Number( page ) - 1;
        } catch {
            //
        }
    }
    const allTorrents = {
        torrents: [],
        hasNextPage: false,
        currentPage: parseInt( page ) + 1
    };
    const url = Category.toLowerCase().includes( "anime" ) ? "https://torrentgalaxy.to/torrents.php?c28=1&search=" + query + "&lang=0&nox=2#results&page=" + page :
        Category.toLowerCase().includes( "tv" ) ? "https://torrentgalaxy.to/torrents.php?c41=1&c5=1&c11=1&c6=1&c7=1&search=" + query + "&lang=0&nox=2#results&page=" + page :
            Category.toLowerCase().includes( "movies" ) ? "https://torrentgalaxy.to/torrents.php?c3=1&c46=1&c45=1&c42=1&c4=1&c1=1&search=" + query + "&lang=0&nox=2#results&page=" + page :
                Category.toLowerCase().includes( "app" ) ? "https://torrentgalaxy.to/torrents.php?c20=1&c21=1&c18=1&search=" + query + "&lang=0&nox=2#results&page=" + page :
                    "https://torrentgalaxy.to/torrents.php?search=" + query + "&sort=id&order=desc&page=" + page;
    let html;
    try {
        html = await axios.get( url );
    } catch {
        return null;
    }

    const $ = cheerio.load( html.data );

    // const timeout = setTimeout( () => {

    $( 'div.tgxtablerow.txlight' ).each( ( i, element ) => {
        const data = {};
        const posterRegex = /\bhttps?:[^)''"]+\.(?:jpg|jpeg|gif|png)(?![a-z])/g;
        data.Name = $( element ).find( ":nth-child(4) div a b" ).text();
        data.Category = $( element ).find( ":nth-child(1) a small" ).text();
        data.Url = "https://torrentgalaxy.to" + $( element ).find( "a.txlight" ).attr( 'href' );
        data.UploadedBy = $( element ).find( ':nth-child(7) span a span' ).text();
        data.Size = $( element ).find( ':nth-child(8)' ).text();
        data.Seeders = $( element ).find( ':nth-child(11) span font:nth-child(1)' ).text();
        data.Leechers = $( element ).find( ':nth-child(11) span font:nth-child(2)' ).text();
        data.DateUploaded = $( element ).find( ":nth-child(12)" ).text();
        data.Torrent = $( element ).find( ".tgxtablecell.collapsehide.rounded.txlight a" ).attr( "href" );
        data.Magnet = $( element ).find( ".tgxtablecell.collapsehide.rounded.txlight a" ).next().attr( "href" );
        allTorrents.torrents.push( data );
    } );

    allTorrents.hasNextPage = !$( "#pager > li.page-item.active.txlight" ).next().hasClass( "disabled" );
    // }, 1500 );

    return allTorrents;
}
module.exports = torrentGalaxy;