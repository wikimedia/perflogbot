'use strict';

var util = require( 'util' ),
	moment = require( 'moment' ),
	versions = {},
	times = {};

function bold( text ) {
	return '\u0002' + text + '\u0002';
}

function handleModuleManifest( manifest, write ) {
	var currentTime = moment.utc(),
		messages = [],
		firstRun = Object.keys( versions ).length === 0;

	manifest.forEach( function ( descriptor ) {
		var module = descriptor[ 0 ],
			currentVersion = descriptor[ 1 ],
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

	if ( !firstRun ) {
		if ( messages.length > 15 ) {
			messages = [ bold( messages.length ) + ' modules changed state.' ];
		}

		write( messages );
	}
}

module.exports = {
	handle: handleModuleManifest
};
