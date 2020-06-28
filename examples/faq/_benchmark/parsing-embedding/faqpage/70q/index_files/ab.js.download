'use strict';

( function( window ) {

	if ( 'undefined' !== typeof CDC && 'undefined' !== typeof CDC.ABTest ) {

		var now = new Date();

		var testId = CDC.ABTest.id();
		var testType = CDC.ABTest.type();
		var redirect = CDC.ABTest.redirect();
		var testActive = CDC.ABTest.active();
		var testViewports = CDC.ABTest.viewports();
		var callback = CDC.ABTest.callback();
		var defaultReportSuite = s ? s.account : 'cdcgov';

		//
		// Method to run A/B module test.
		//
		var runAbTest = function( item, opts ) {

			var deferred = $.Deferred();

			var parms = {
				toolsUrl: item.attr( 'data-tools-url' ),
				reportSuite: opts.reportSuite,
				pageName: item.attr( 'data-page-name' )
			};

			if ( item.attr( 'data-selector' ) && '' !== item.attr( 'data-selector' ) ) {
				opts.selector = item.attr( 'data-selector' );
			}

			opts.variantSelector = item.attr( 'data-variant-selector' );
			if ( item.attr( 'data-percent-variant' ) && ! isNaN( parseInt( item.attr( 'data-percent-variant' ) ) ) ) {
				opts.percentVariant = parseInt( item.attr( 'data-percent-variant' ) );
			}

			opts = $.extend( opts, parms );

			var queryParms = window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ).split( '&' );

			var highlightParam = $.grep( queryParms, function( param ) {
				return -1 < param.indexOf( 'highlight=true' );
			} );
			var highlight = 0 < highlightParam.length;

			var overrideVariant = $.map( queryParms, function( param ) {
				if ( -1 < param.indexOf( 'variant=' ) ) {
					return param.split( '=' )[ 1 ];
				}
			} );

			if ( overrideVariant && 0 < overrideVariant.length ) {
				overrideVariant = overrideVariant[ 0 ];
			} else {
				overrideVariant = '';
			}

			var expDate = new Date();
			expDate.setTime( expDate.getTime() + 24 * 60 * 60 * 1000 ); // add 1 day

			if ( overrideVariant && 0 < overrideVariant.length ) {
				if ( 'baseline' === overrideVariant ) {
					item.attr( 'data-ab-option', '' );
				} else {
					item.attr( 'data-ab-option', opts.contentId );
				}
			}

			if ( '' !== item.attr( 'data-ab-option' ) ) {
				var block = $( '#' + opts.contentId ).contents();
				console.log( block );
				var repl = $( '<div />' );
				for ( var i = 0; i < block.length; i++ ) {
					if ( 8 === block[ i ].nodeType ) {
						repl = $( block[ i ].nodeValue );
						break;
					}
				}
				repl.attr( 'id', opts.contentId );
				repl.attr( 'data-ab-option', item.attr( 'data-ab-option' ) );
				repl.attr( 'data-abid', item.attr( 'data-abid' ) );
				$( '#' + opts.contentId ).remove();
				$( opts.selector ).replaceWith( repl );
				opts.selector = '#' + opts.contentId;
				document.cookie = 'CDC_ABTest_' + testId + '_' + opts.contentId + '_' + opts.abId + '=' + opts.contentId + '; expires=' + expDate.toGMTString() + '; path=/; secure';
			} else {
				item.attr( 'data-ab-option', 'baseline' );
				document.cookie = 'CDC_ABTest_' + testId + '_' + opts.contentId + '_' + opts.abId + '=; expires=' + expDate.toGMTString() + '; path=/; secure';
			}

			if ( highlight ) {
				$( opts.selector ).attr( 'style', 'border: 4px solid rgb(201, 34, 34)!important; padding: 4px!important' );
			}

			$( opts.selector ).attr( 'data-abid', item.attr( 'data-abid' ) );
			$( opts.selector ).attr( 'data-ab-option', item.attr( 'data-ab-option' ) );

			$( opts.selector ).find( 'a' ).on( 'click', function( e ) {
				var tag = $( this );
				var anchorCount = $( opts.selector ).find( 'a' ).length;
				var abAnchorCount = $( opts.selector ).find( 'a.ab-track-link' ).length;
				console.log( 'tag', tag.children( 'a' ) );
				console.log( 'tag.hasClass("ab-track-link")', tag.hasClass( 'ab-track-link' ) );
				var trackLink = false;
				if ( ( 1 < anchorCount && 0 === abAnchorCount ) || ( 1 === anchorCount && 0 === abAnchorCount ) ) {
					trackLink = true;
				} else if ( tag.is( 'a' ) ) {
					trackLink = tag.hasClass( 'ab-track-link' );
				} else if ( 1 === tag.children( 'a' ).length ) {
					trackLink = tag.children( 'a' ).hasClass( 'ab-track-link' );
				}
				if ( trackLink ) {
					var s = s_gi( opts.reportSuite );
					s.pageName = document.title;
					s.prop64 = testId;
					s.events = 'event2';
					s.eVar8 = $( opts.selector ).attr( 'data-abid' ) + '_' + $( opts.selector ).attr( 'data-ab-option' );
					s.linkTrackEvents = 'event2';
					s.linkTrackVars = 'prop2,prop31,prop46,prop18,prop64,pageName,events,eVar8';
					s.tl( true, 'o', item.attr( 'data-ab-option' ) );
				}
				if ( tag.is( 'a' ) ) {
					e.preventDefault();
					setTimeout( function( url ) {
						window.location = url;
					}, 200, tag.attr( 'href' ) );
				} else if ( 1 === tag.children( 'a' ).length ) {
					e.preventDefault();
					setTimeout( function( url ) {
						window.location = url;
					}, 200, tag.children( 'a' ).attr( 'href' ) );
				}
			} );

			deferred.resolve( true );

			return deferred.promise();
		};

		var findTp4Viewport = function() {
			var result = '';
			var envs = [ 'xs', 'sm', 'md', 'lg', 'xl', 'xxl' ];
			var el = $( '<div />' );
			el.appendTo( $( 'body' ) );
			for ( var i = envs.length - 1; 0 <= i; i-- ) {
				var env = envs[ i ];
				el.addClass( 'd-' + env + '-none' );
				if ( 'none' === el.css( 'display' ) ) {
					el.remove();
					result = env;
					break;
				}
			}
			return result;
		};

		var findTp3Viewport = function() {
			var result = '';
			var envs = [ 'one', 'two', 'three', 'four' ];
			var el = $( '<div />' );
			el.appendTo( $( 'body' ) );
			for ( var i = envs.length - 1; 0 <= i; i-- ) {
				var env = envs[ i ];
				el.addClass( 'hidden-' + env );
				if ( el.is( ':hidden' ) ) {
					el.remove();
					result = env;
					break;
				}
			}
			return result;
		};

		//
		// Check to see if the test is restricted to certain viewports and, if so, check to see if the current viewport is in the ones specified for the test.
		//
		var currentViewport = findTp4Viewport();
		if ( '' === currentViewport ) {				// TP4
			currentViewport = findTp3Viewport();
		}
		if ( testActive ) {
			if ( testViewports && 0 < testViewports.length && '' !== currentViewport ) {
				testActive = -1 < $.inArray( currentViewport, testViewports );
			}
		}

		var abId;
		var reportSuite;
		var useVariant;
		var abCookieValue;
		var abCookie;
		var abCookies;
		var cookies;

		//
		// Check to see what type of test is being requested and run the test(s).
		//
		if ( testActive && CDC.ABTest.TEST_TYPE_REDIRECT === testType ) {
			// Use the values passed in on the redirect object within the settings to determine whether to redirect or not and to send metrics.
			abId = redirect.id;
			var percent = redirect.percent;

			abId = 'AB_Redirect_' + abId;

			// Check to see if report suite has been overridden.
			reportSuite = redirect.reportSuite;
			if ( 'undefined' === typeof reportSuite || 0 === reportSuite.length ) {
				reportSuite = defaultReportSuite;
			}

			useVariant = Math.round( 100 * Math.random() ) > ( 100 - percent );
			var currentUrl = window.location.href;
			var baselineUrl = redirect.baselineUrl;
			var variantUrl = redirect.variantUrl;

			// Check to see if variant page is being directly hit via bookmark/direct link.
			if ( currentUrl === variantUrl && '' === document.referrer ) {
				console.log( 'Empty referrer' );
				// We are on the variant page, but got here directly.  Go back to baseline page to run the A/B test.
				window.location = baselineUrl;
			} else if ( currentUrl === baselineUrl || currentUrl === variantUrl ) {
				// We are on a page that is part of this split page/redirect test.
				console.log( 'On a redirect test page' );

				abCookieValue = '';
				abCookie = '';
				abCookies = [];
				if ( redirect.sticky ) {
					cookies = document.cookie.split( ';' );
					abCookies = cookies.filter( function( cookieItem ) {
						return -1 < cookieItem.indexOf( 'CDC_ABTest_Redirect_' + testId + '_' + redirect.id );
					} );
					if ( 0 < abCookies.length ) {
						abCookie = abCookies[ 0 ].split( '=' );
						if ( 0 < abCookie.length ) {
							abCookieValue = abCookie[1];
							useVariant = abCookieValue === variantUrl ? true : abCookieValue === baselineUrl;
						}
					}
				}

				if ( currentUrl === variantUrl && '' === abCookieValue && redirect.sticky ) {
					console.log( 'On a redirect variant page with no cookie' );
					// We are on the variant page, but got here without a cookie being set by the baseline page.  Go back to baseline page to run the A/B test.
					useVariant = false;
					window.location = baselineUrl;
				} else if ( currentUrl === abCookieValue || '' === abCookieValue ) {
					var abOption = currentUrl === variantUrl ? 'variant' : 'baseline';
					var targetUrl = useVariant ? variantUrl : baselineUrl;
					console.log( 'On a redirect variant page with useVariant = ' + useVariant );

					s.prop64 = testId;
					s.eVar8 = abOption;

					document.cookie = 'CDC_ABTest_Redirect_' + testId + '_' + redirect.id + '=' + targetUrl + '; path=/; secure';
				} else {
					console.log( 'Something else' );
					useVariant = false;
				}

			} else {
				console.log( 'On a page that is not part of the test' );
				useVariant = false;
			}

			if ( useVariant && ( window.location.href !== targetUrl ) ) {
				s = {};
				ga = {};
				window.location = targetUrl;
			} else {
				document.documentElement.className = document.documentElement.className.replace( RegExp( ' ?d-none' ), '' );
			}

			// Rewrite the URL in the left nav if we are on the variant page.
			if ( window.location.href.toLowerCase() !== baselineUrl.toLowerCase() ) {
				var baselineRelUrl = baselineUrl;
				if ( -1 < baselineRelUrl.indexOf( '//' ) ) {
					baselineRelUrl = baselineRelUrl.substring( baselineRelUrl.indexOf( '//' ) + 2 );
					baselineRelUrl = baselineRelUrl.substring( baselineRelUrl.indexOf( '/' ) );
				}

				var currentRelUrl = window.location.href;
				if ( -1 < currentRelUrl.indexOf( '//' ) ) {
					currentRelUrl = currentRelUrl.substring( currentRelUrl.indexOf( '//' ) + 2 );
					currentRelUrl = currentRelUrl.substring( currentRelUrl.indexOf( '/' ) );
				}

				if ( 0 < $( 'nav ul li a[href="' + baselineRelUrl + '"]' ).length ) {
					$( 'nav ul li a[href="' + baselineRelUrl + '"]' ).attr( 'href', currentRelUrl );
				}
			}

		} else if ( testActive ) {

			// Check to see if we have any tests to run on the page.
			var cdcAbDivs = $( 'div[data-abid]' );
			if ( 0 < cdcAbDivs.length ) {

				//
				// Run the tests on the page.
				//

				var promises = [];

				$( 'div[data-abid]' ).each( function() {

					// add new class to first occurrence of .syndicate
					$( '.syndicate' ).first().addClass( 'first-syndicate' );

					var options = {
						abId: '',
						mediaId: '',
						variantMediaId: '',
						contentId: '',
						selector: '.syndicate.first-syndicate', // use new .first-syndicate class to get first occurrence
						percentVariant: 50,
						variantSelector: '.syndicate.first-syndicate',
						pageName: 'original',
						sticky: true,
						toolsUrl: 'https://tools.cdc.gov/api/v2/resources/media/',
						reportSuite: defaultReportSuite
					};

					var item = $( this );
					abId = item.attr( 'data-abid' );
					if ( '' !== abId ) {
						if ( 0 > abId.indexOf( 'AB_' ) ) {
							abId = 'AB_' + abId;
						}
						options.abId = abId;
						// Check to see if report suite has been overridden.
						reportSuite = item.attr( 'data-report-suite' );
						if ( reportSuite && 0 < reportSuite.length ) {
							options.reportSuite = reportSuite;
						}
						// Get sample/switch percentage.
						var requestedPercent = item.attr( 'data-percent-variant' );
						if ( requestedPercent && ! isNaN( parseInt( requestedPercent ) ) ) {
							options.percentVariant = parseInt( requestedPercent );
						}
						useVariant = Math.round( 100 * Math.random() ) > ( 100 - options.percentVariant );

						var requestedStickiness = item.attr( 'data-sticky' );
						abCookieValue = '';
						abCookie = '';
						abCookies = [];
						if ( requestedStickiness ) {
							options.sticky = requestedStickiness;
						}

						options.contentId = item.attr( 'id' );

						if ( 'true' === options.sticky || options.sticky ) {
							cookies = document.cookie.split( ';' );
							abCookies = cookies.filter( function( cookieItem ) {
								return -1 < cookieItem.indexOf( 'CDC_ABTest_' + testId + '_' + options.contentId + '_' + abId );
							} );
						}
						if ( 0 < abCookies.length ) {
							abCookie = abCookies[ 0 ].split( '=' );
							if ( 0 < abCookie.length ) {
								abCookieValue = abCookie[ 1 ];
							}
						}

						var contentIdToUse = '';

						if ( '' !== abCookieValue && ( options.sticky || 'true' === options.sticky ) ) {
							contentIdToUse = abCookieValue;
						} else if ( useVariant ) {
							contentIdToUse = options.contentId;
						}

						item.attr( 'data-abid', abId );
						item.attr( 'data-ab-option', contentIdToUse );

						promises.push( runAbTest( item, options ) );

					}

				} );

				//
				// Set the metrics properties for the page view beacon call.
				//
				s.prop64 = testId;
				s.eVar8 = cdcAbDivs.map( function() {
					abId = $( this ).attr( 'data-abid' );
					abOption = $( this ).attr( 'data-ab-option' );
					var id = $( this ).attr( 'id' );
					if ( 'undefined' === typeof abOption || '' === abOption ) {
						if ( 'undefined' === typeof id || '' === id ) {
							abOption = 'not_set';
						} else {
							abOption = 'baseline';
						}
					}
					return abId + '_' + abOption;
				} ).get().join( ';' );

				$.when.apply( $, promises ).then( function( values ) {
					console.log( 'Got content for all tests' );
					callback();
					document.documentElement.className = document.documentElement.className.replace( RegExp( ' ?d-none' ), '' );
				} );

			}

		} else {
			// No active test.  Just re-enable the page display.
			console.log( 'Test is not active' );
			document.documentElement.className = document.documentElement.className.replace( RegExp( ' ?d-none' ), '' );
		}

	}

} )( window );
