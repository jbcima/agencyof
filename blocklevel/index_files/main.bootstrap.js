/**
 *	Set the paths to always require
 *
 *  This is the development version of the backdrop
 *  In use only on the dev servers as a way around using
 *  the _dist while developing
 */

requirejs.config({

	waitSeconds : 30,
	
	baseUrl: '/_jsapps/backdrop',

	paths: {
		'text' 			: "//static.cargo.site/libs/require/text.min",
		'css' 			: "//static.cargo.site/libs/require/css.min",
		'three'			: "_libs/three.min",
		'three.extends'	: "_libs/three.extends"
	},
	shim: {
		three: {
			exports: 'THREE'
		}
	}

});

Backdrop.Data.require_loaded = true;