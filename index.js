'use strict';

var https = require( 'https' ),
	util = require( 'util' ),
	irc = require( 'irc' ),
	moment = require('moment'),
	config = require( './config.json' ),
	bot = new irc.Client(
		config.server,
		config.botName,
		config.options
	),
	httpsOptions = {
		hostname: config.hostname || 'nl.wikipedia.org',
		path: '/w/load.php?modules=startup&only=scripts',
		rejectUnauthorized: false
	},
	versions = {},
	times = {};


bot.addListener( 'names', function () {
	fetchModuleManifest();
	setInterval( fetchModuleManifest, 10 * 1000 );
} );

function fetchModuleManifest() {
	var req = https.request( httpsOptions, function (res ) {
		var body = '';
		res.on( 'data', function ( chunk ) {
			body += chunk;
		} );

		res.on( 'end', function () {
			body = body.slice( 
				body.indexOf( 'register(' ) + 'register('.length,
				body.indexOf( ');;' )
			);
			handleModuleManifest( JSON.parse( body ) );
		} );
	} );

	req.end();
}

function bold( text ) {
	return '\u0002' + text + '\u0002';
}

function handleModuleManifest( manifest ) {
	var currentTime = moment.utc(),
		messages = [];

	manifest.forEach ( function ( descriptor ) {
		var module = descriptor[0],
			currentVersion = descriptor[1],
			previousVersion = versions[ module ],
			previousTime = times[ module ];

		if ( previousVersion === undefined ) {
			messages.push( util.format( '%s: %s (new module)', bold( module ), currentVersion ) );
		} else if ( currentVersion !== previousVersion ) {
			messages.push( util.format( '%s: %s => %s (after %s)', bold( module ), previousVersion,
				currentVersion, currentTime.from( previousTime, true ) ) );
		}

		versions[ module ] = currentVersion;
		times[ module ] = currentTime;
	} );

	if ( messages.length > 15 ) {
		messages = [ bold( messages.length ) + ' modules changed state.' ];
	}

	messages.forEach( function ( message ) {
		console.log( message );
		config.options.channels.forEach( function ( channel ) {
			bot.say( channel, message );
		} );
	} );
}
