'use strict';

var https = require( 'https' ),
	util = require( 'util' ),
	irc = require( 'irc' ),
	moment = require( 'moment' ),
	config = require( 'config' ),
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

function bold( text ) {
	return '\u0002' + text + '\u0002';
}

function handleModuleManifest( manifest ) {
	var currentTime = moment.utc(),
		messages = [],
		firstRun = Object.keys( versions ).length === 0;

	manifest.forEach( function ( descriptor ) {
		var module = descriptor[0],
			currentVersion = descriptor[1],
			previousVersion = versions[ module ],
			previousTime = times[ module ];

		if ( currentVersion !== previousVersion ) {
			if ( previousVersion === undefined ) {
				messages.push( util.format( '%s: %s (new module)', bold( module ), currentVersion ) );
			} else {
				messages.push( util.format( '%s: %s => %s (after %s)', bold( module ),
					previousVersion, currentVersion, previousTime.from( currentTime, true ) ) );
			}
			versions[ module ] = currentVersion;
			times[ module ] = currentTime;
		}
	} );

	if ( messages.length > 15 ) {
		messages = [ bold( messages.length ) + ' modules changed state.' ];
	}

	if ( !firstRun ) {
		messages.forEach( function ( message ) {
			config.options.channels.forEach( function ( channel ) {
				bot.say( channel, message );
			} );
		} );
	}
}

function fetchModuleManifest() {
	var req = https.request( httpsOptions, function ( res ) {
		var body = '';
		res.on( 'data', function ( chunk ) {
			body += chunk;
		} );

		res.on( 'end', function () {
			body = body.slice(
				body.indexOf( 'register(' ) + 'register('.length,
				body.indexOf( ');;' )
			);
			try {
				handleModuleManifest( JSON.parse( body ) );
			} catch ( e ) {
				console.error( e );
			}
		} );
	} );

	req.end();
}

bot.once( 'names', function () {
	setInterval( fetchModuleManifest, 10 * 1000 );

	// Every thirty seconds, check that the bot is operating under its canonical
	// nickname, and attempt to regain it if not. (NickServ's "regain" command
	// will modify the bot's nickname, if successful.)
	setInterval( function () {
		if ( bot.nick !== config.botName ) {
			bot.say( 'NickServ', 'regain ' + config.botName );
		}
	}, 30 * 1000 );
} );
