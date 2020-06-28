/* Raw JS */
MP.UrlLang='mp_js_current_lang';
MP.SrcUrl=decodeURIComponent('mp_js_orgin_url');
MP.oSite=decodeURIComponent('mp_js_origin_baseUrl');
MP.tSite=decodeURIComponent('mp_js_translated_baseUrl');
MP.init();
var mp_langLink = function() {
    var langlinks = document.querySelectorAll('.langLink');
    for (var i = 0; i < langlinks.length; i++) {
        langlinks.item(i).onclick = function() {
            MP.init();
            var lang = this.getAttribute('data-lang');
            var url = this.getAttribute('data-href');
            var tSite = MP.tSite.replace(/(https?:\/\/|\/?$)/g,'');
            url = url.replace(/(https?:\/\/|\/?$)/g,'');
            MP.switchLanguage(tSite.search(url)!=-1?MP.oSite:url, lang, true);
            return false;
        }
    }
};
if(window.addEventListener){
	window.addEventListener('load',mp_langLink,false);
}else if(window.attachEvent){
	window.attachEvent('onload',mp_langLink);
}
/* End Raw JS */
