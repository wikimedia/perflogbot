'use strict';

var https = require( 'https' ),
	irc = require( 'irc' ),
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
	handleModuleManifest = require( './utils' ).handle;

function sendBotMessage( messages ) {
	messages.forEach( function ( message ) {
		config.options.channels.forEach( function ( channel ) {
			bot.say( channel, message );
		} );
	} );
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
				handleModuleManifest( JSON.parse( body ), sendBotMessage );
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
