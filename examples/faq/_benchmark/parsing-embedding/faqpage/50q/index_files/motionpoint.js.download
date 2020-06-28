/* Raw JS */
var MP = {
	<!--mp_trans_disable_start -->
	Version: '3.2.1.0',
	SrcLang: 'en',
	<!--mp_trans_disable_end -->
    UrlLang: 'mp_js_current_lang',
	SrcUrl: decodeURIComponent('mp_js_orgin_url'),
	oSite: decodeURIComponent('mp_js_origin_baseUrl'),
	tSite: decodeURIComponent('mp_js_translated_baseUrl'),
	<!--mp_trans_disable_start -->
	init: function() {
		if (MP.oSite.indexOf('p_js_') == 1) {
			MP.SrcUrl = window.top.document.location.href;
			MP.oSite = MP.tSite = window.top.document.location.host;
			MP.UrlLang = MP.SrcLang;
		}
	},
	switchLanguage: function(url, pref, sync) {
		var sync = sync;
		var oSite=MP.oSite.replace('http://','').replace('https://','').replace(/\/?$/, '/');
		var tSite=MP.tSite.replace('http://','').replace('https://','').replace(/\/?$/, '/');
		url=url.replace('http://','').replace('https://','').replace(/\/?$/, '/');
		if(sync && (typeof MpStorage !== 'undefined')&&(typeof MpStorage.updatePref !== 'undefined')){
			MpStorage.updatePref(url,pref);
		}
		lang = pref.substring(0,2);
		setTimeout(function() {
			var script = document.createElement('SCRIPT');
			if (url == oSite) {
				tSite = tSite.split(/[/?#]/)[0];
				script.src = location.protocol + '//' + tSite + '/' + MP.SrcLang + MP.UrlLang + '/?1023749634;' + encodeURIComponent(location.href);
			} else {
			 if(MP.SrcLang==lang && tSite == oSite){return false;}
				url = url.split(/[/?#]/)[0];
				script.src = location.protocol + '//' + url + '/' + MP.SrcLang + lang + '/?1023749632;' + encodeURIComponent(MP.SrcUrl);
			}
			var target = document.getElementsByTagName('script')[0];
			target.parentNode.insertBefore(script, target);
		}, 500);
		return false;
	},
	switchToLang: function(url) {
		if(window.top.location.href == url){
			if((typeof MpStorage !== 'undefined')&&(typeof MpStorage.updatePref !== 'undefined'))
			MpStorage.updatePref(MP.oSite,MP.SrcLang);
		}else{
			window.top.location.href = url;
		}
	}
	<!-- mp_trans_disable_end -->   
};
/* End Raw JS */
