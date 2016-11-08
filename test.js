var assert = require( 'assert' ),
	time = require( 'timekeeper' ),
	handle = require( './utils' ).handle;

time.freeze( Date.parse( '2011-04-01T00:00:00' ) );

handle(
	[
		[ 'example', 'v1' ],
		[ 'test', 'aa' ],
		[ 'more', 'foo' ]
	],
	function () {
		assert.ifError( new Error( 'No messages expected at first run' ) );
	}
);

time.freeze( Date.parse( '2011-04-01T00:08:30' ) );

handle(
	[
		[ 'example', 'v1' ],
		[ 'test', 'ab' ],
		[ 'more', 'foo' ]
	],
	function ( messages ) {
		assert.strictEqual(
			messages[0],
			'\u0002test\u0002: aa => ab (after 9 minutes)'
		);
	}
);

time.freeze( Date.parse( '2011-04-01T01:08:30' ) );

handle(
	[
		[ 'example', 'v2' ],
		[ 'test', 'bb' ],
		[ 'more', 'bar' ]
	],
	function ( messages ) {
		assert.strictEqual(
			messages[0],
			'\u0002example\u0002: v1 => v2 (after an hour)'
		);
		assert.strictEqual(
			messages[1],
			'\u0002test\u0002: ab => bb (after an hour)'
		);
		assert.strictEqual(
			messages[2],
			'\u0002more\u0002: foo => bar (after an hour)'
		);
	}
);

console.log( 'Passed!' );
