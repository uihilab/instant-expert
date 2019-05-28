const InstantExpertHelper = {
    KEYCODE: {
        ENTER: 13
    },

    template: document.createElement('template'),
    inputPlaceholder: "Type your question and press enter",

    getTemplateHTML: function() {
        return `
            <img id="show-hide-expert" src="${InstantExpertResources.PERSON_BUTTON}">
            
            <div id="expert-container">
                    <img id="expert-logo" src="${InstantExpertResources.DEFAULT_LOGO}">
                    <div id="question-box-container">
                        <img   id="list-button"  class="question-button" title      ="Click to see the list of predefined questions" src="${InstantExpertResources.LIST_SYMBOL}">
                        <input id="question-box"                         placeholder="${this.inputPlaceholder}">
                        <img   id="voice-button" class="question-button" title      ="Click to make a voice-enabled search"          src="${InstantExpertResources.VOICE_SYMBOL}">
                    </div>
                    
                    <div id="io-window-container">
                        <div id="output-container"></div>
                        
                        <div id="question-list-container">
                            <div id="leftpane">
                                <div id="category-header">Knowledge Groups</div>
                                <ul id="categories">
                                </ul>
                            </div>
                            <div id="midpane">
                            </div>
                        </div>
                    </div> <!-- End of IO Window -->
            </div>

            <style>
                ${InstantExpertResources.STYLESHEET}
            </style>    `;
    }
}

class InstantExpert extends HTMLElement {

    static get observedAttributes() {
        return ["engine"];
    }

    constructor() {
        super();
        var template = InstantExpertHelper.template;
        var templateHTML = InstantExpertHelper.getTemplateHTML();
        var shadowElement = this.attachShadow({
            mode: 'open'
        })
        template.innerHTML = templateHTML;
        shadowElement.appendChild(template.content.cloneNode(true));
        this._shadowElement = shadowElement;
    }

    connectedCallback() {
        this.addEventListeners();
        this.processAttributes();
    }

    processAttributes(){
        /**************New Attribute Group**************/
        // Process attributes for the data that will passed and received
        // for the POST Request to the engine
        if(!this.postRequestQuestionKey) this.postRequestQuestionKey = 'question';
        if(!this.postRequestResponseKey) this.postRequestResponseKey = 'resultText';

        /**************New Attribute Group**************/
        // Process attributes for the main button to toggle expert window
        if(this.hasAttribute('expert-button-src')) {
            this.getShadowElementById("#show-hide-expert").src = this.expertButtonSource;
        }

        /**************New Attribute Group**************/
        // Process attributes for the logo visibility and source
        if(this.logoHidden) this.hideByID("#expert-logo");
        if(this.hasAttribute('logo-src')) {
            this.getShadowElementById("#expert-logo").src = this.logoSource;
        }

        /**************New Attribute Group**************/
        // Process attributes for the text box
        if(this.hasAttribute('textbox-placeholder')) {
            this.getShadowElementById("#question-box").placeholder = this.textboxPlaceholder;
        }
        
        /**************New Attribute Group**************/
        // Process attributes for the disabling question list and voice input
        if(this.noQuestionList) this.invisiblizeByID("#list-button");
        if(this.noVoice) this.invisiblizeByID("#voice-button");
    }

    addEventListeners(){
        var context = this;

        /**************New Event Listener**************/
        // Show/Hide Expert Container
        var eventFunction_ExpertContainer = function (){
            context.toggleViewOnClick('#expert-container');
        }
        this.addOnClickFunction('#show-hide-expert', eventFunction_ExpertContainer);

        /**************New Event Listener**************/
        // Show/Hide IO Window Container
        var eventFunction_IOWindow = function (){
            context.toggleViewOnClick('#question-list-container');
            context.hideByID("#output-container");
        }
        this.addOnClickFunction('#list-button', eventFunction_IOWindow);

        /**************New Event Listener**************/
        // Show the List of Questions for Each Category
        var selectQuestionCategory = function (event){
            // Get all elements with class="question-list" and hide them
            var questionLists = context._shadowElement.querySelectorAll(".question-list");
            for (var i = 0; i < questionLists.length; i++) {
                questionLists[i].style.display = "none";
            }
            context.showByID('#'+event.target.id+'-qs');
        }
        this.addOnClickFunction('#categories', selectQuestionCategory);

        /**************New Event Listener**************/
        // Select a question from the list, and ask for the answer
        var selectQuestion = function (event){
            var inputBox = context.getShadowElementById("#question-box");
            inputBox.value = event.target.innerHTML;

            context.postRequest(event.target.innerHTML);
        }
        this.addOnClickFunction('#midpane', selectQuestion);

        /**************New Event Listener**************/
        // Ask the question that is written into the text box, by pressing Enter key
        var askTextInputQuestion = function (event){
            var keyCode = event.keyCode || event.charCode
            if(keyCode == InstantExpertHelper.KEYCODE.ENTER){
                context.postRequest(event.target.value);
            }
        }
        this.addOnKeypressFunction('#question-box', askTextInputQuestion);

        /**************New Event Listener**************/
        // Activate voice input by clicking microphone icon
        var activateVoice = function (event){
            window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            if ('SpeechRecognition' in window) {
              context.askVoiceQuestion();
            } else {
              alert("Speech recognition API is not supported");
            }
        }
        this.addOnClickFunction('#voice-button', activateVoice);

    }

    askVoiceQuestion() {
        var inputBox = this.getShadowElementById("#question-box");
        inputBox.placeholder = "Talk to expert...";

        const recognition = new window.SpeechRecognition();
        recognition.interimResults = true;
        recognition.maxAlternatives = 10;
        recognition.continuous = true;
        recognition.lang = 'en-US';
        let finalTranscript = '';

        recognition.onresult = (event) => {

            let interimTranscript = '';
            for (let i = event.resultIndex, len = event.results.length; i < len; i++) {
                let transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                    inputBox.value = interimTranscript;
                }
            }
            this.postRequest(finalTranscript);
            inputBox.placeholder = InstantExpertHelper.inputPlaceholder;
        }

        // Listen for errors
        recognition.onerror = function(event) {
            console.log('Recognition error: ' + event.message);
            inputBox.placeholder = InstantExpertHelper.inputPlaceholder;
        };

        recognition.start();
    }

    toggleViewOnClick(toggledElementId){
        var x = this._shadowElement.querySelector(toggledElementId);
        var xs = getComputedStyle(x);
        if (xs.display === "none") {
            x.style.display = "block";
        } else {
            x.style.display = "none";
        }
    }

    addOnClickFunction(clickedElementId, eventFunction){
        this._shadowElement.querySelector(clickedElementId).onclick = eventFunction;
    }

    addOnKeypressFunction(clickedElementId, eventFunction){
        this._shadowElement.querySelector(clickedElementId).onkeypress = eventFunction;
    }

    postRequest(questionText, callback){
        var dataParams = {};
        dataParams[this.postRequestQuestionKey] = questionText;

        var responseKey = this.postRequestResponseKey;

        var context = this;
        $.ajax({
            type: 'POST',
            url: this.engine,
            timeout: 2000,
            data: dataParams,
            success:function(response) {
                var responseJSON = JSON.parse(response);
                var responseText = responseJSON[responseKey];
                context.printResponseCallback(responseText);
            }
        });
    }

    printResponseCallback(response){
        var outputContainer = this._shadowElement.querySelector("#output-container");
        outputContainer.innerHTML = response;
        this.show(outputContainer);
        this.hideByID("#question-list-container");
    }

    /***********************Public Functions***********************/
    /**************************************************************/
    setQuestions(questionList){
        var categoriesContainer = this.getShadowElementById("#categories");
        var questionsContainer = this.getShadowElementById("#midpane");

        let categories = [...new Set(questionList.map(item => item[1]))];

        var questions;
        for (let [index, category] of categories.entries()) {
            // Create Category
            var catElement = document.createElement('li');
            catElement.innerHTML = category;
            catElement.setAttribute('id','cat'+index);
            catElement.setAttribute('class','category-tab');
            categoriesContainer.appendChild(catElement);

            // Create Question Group
            var queGroupElement = document.createElement('ul');
            queGroupElement.setAttribute('id','cat'+index+"-qs");
            queGroupElement.setAttribute('class','question-list');
            questionsContainer.appendChild(queGroupElement);

            // Add questions to the created category
            questions = questionList.filter(question => question[1] == category);
            for (let question of questions) {
                var queElement = document.createElement('li');
                queElement.innerHTML = question[0];
                queGroupElement.appendChild(queElement);
            }
        }
    }

    /**************Getter/Setter and Helper Functions**************/
    /**************************************************************/
    get engine() {
        return this.getAttribute('engine');
    }

    set engine(newValue) {
        this.setAttribute('engine', newValue);
    }

    get postRequestQuestionKey() {
        return this.getAttribute('engineDataKey');
    }

    set postRequestQuestionKey(newValue) {
        this.setAttribute('engineDataKey', newValue);
    }

    get postRequestResponseKey() {
        return this.getAttribute('engineResponseKey');
    }

    set postRequestResponseKey(newValue) {
        this.setAttribute('engineResponseKey', newValue);
    }

    get logoHidden() {
      return this.hasAttribute('logo-hidden');
    }

    set logoHidden(isHidden) {
      if (isHidden) {
        this.setAttribute('logo-hidden', '');
      } else {
        this.removeAttribute('logo-hidden');
      }
    }

    get logoSource() {
        return this.getAttribute('logo-src');
    }

    set logoSource(newValue) {
        this.setAttribute('logo-src', newValue);
    }

    get expertButtonSource() {
        return this.getAttribute('expert-button-src');
    }

    set expertButtonSource(newValue) {
        this.setAttribute('expert-button-src', newValue);
    }

    get textboxPlaceholder() {
        return this.getAttribute('textbox-placeholder');
    }

    set textboxPlaceholder(newValue) {
        this.setAttribute('textbox-placeholder', newValue);
    }

    get noQuestionList() {
      return this.hasAttribute('no-question-list');
    }

    set noQuestionList(isQuestionListDisabled) {
      if (isQuestionListDisabled) {
        this.setAttribute('no-question-list', '');
      } else {
        this.removeAttribute('no-question-list');
      }
    }

    get noVoice() {
      return this.hasAttribute('no-voice');
    }

    set noVoice(isVoiceDisabled) {
      if (isVoiceDisabled) {
        this.setAttribute('no-voice', '');
      } else {
        this.removeAttribute('no-voice');
      }
    }

    getShadowElementById(id){
        return this._shadowElement.querySelector(id);
    }

    show(element){
        element.style.display = "block";
    }

    hide(element){
        element.style.display = "none";
    }

    invisiblize(element){
        element.style.visibility = "hidden";
    }

    showByID(id){
        this.show(this.getShadowElementById(id));
    }

    hideByID(id){
        this.hide(this.getShadowElementById(id));
    }

    invisiblizeByID(id){
        this.invisiblize(this.getShadowElementById(id));
    }

}
if (window.customElements) {
    customElements.define('instant-expert', InstantExpert);
}


/**********************************************************************************/
/*************************BELOW ARE CSS AND VISUAL RESOURCES***********************/
/**********************************************************************************/
/* 
   The purpose of combining everything in one file is to allow easy import without
   requiring any frameworks or installation 
*/

const InstantExpertResources = {
    STYLESHEET: `
        div, ul, li {
            padding: 0;
            margin: 0;
        }

        a {
            color: #800;
        }

        .active { 
          display: block;
        }

        #show-hide-expert {
            cursor: pointer;
            position: fixed;
            top: 45%;
            left: 5px;
            height: 52px;
            border-radius: 2px;
            background-color: #fff;
        }

        #expert-container {
            contain: content;
            text-align: center;
            position: absolute;
            font-family: Gill Sans MT;
            left: 50%;
            top:  50%;
            transform: translate(-50%, -50%);
            display: none;
            width: min-content;
        }

        #expert-logo {
            position: relative;
            height: 50px;
            padding: 10px;
            border-radius: 1em;
            width: auto;
        }

        #question-box-container {
            width: 720px;
            border-style: inset;
            border: 2px solid #bbb;
            background: white;
        }

        #question-box{
            width: 83%;
            text-align: center;
            line-height: 60px;
            font-size: 24px;
            vertical-align: middle;
            border:  none;
            outline: none;
        }

        .question-button{
            width: 6%;
            cursor: pointer;
            vertical-align: middle;
        }

        #io-window-container{
            display: block;
        }

        #output-container{
            display: none;
            font-size: 22px;
            background-color: #fff;
            border-style: inset;
            border: 2px solid #bbb;
            word-wrap: break-word;
            padding: 20px 25px;
        }

        #question-list-container {
            height: 210px;
            display: none;
        }

        .input-div {
            display: none;
            margin-bottom: 5px;
        }
        .question-list {
            display: none;
        }

        #header {
            border-bottom: 0px solid #999;
            width: 728px;
            padding: 11px 10px 13px 15px;
            font-size: 23px;
            line-height: 23px;
            color: #FFF;
            
            background: #5D9D2D; /* for non-css3 browsers */    
            
        }

        #category-header {
            border: 0px solid #880000;
            padding: 2px 7px 2px 7px;
            border-bottom: 1px solid #000;
            border-right: 2px solid #111;
            font-size: 12px;
            line-height: 20px;
            color: #FFF;    
            
            background: #556274; /* for non-css3 browsers */
        }
        #leftpane {
            width: 22.63%;
            height: inherit;
            float: left;
            overflow: auto;
            background: #F4FAFE; /* for non-css3 browsers */
            border-style: inset;
            border: 2px solid #bbb;
        }

        #leftpane ul {
            list-style: none;
        }
        #leftpane ul li {
            font-size: 16px;
            line-height: 16px;
            padding: 9px 7px 11px 11px;
            border-bottom: 1px solid #333;
            cursor: pointer;
            color: #111;    
            background: #EEE; /* for non-css3 browsers */
        }

        #leftpane ul li:hover { 
            color: #333;    
            background: #C0CFD6; /* for non-css3 browsers */
        }

        #leftpane ul li.lefthover { 
            color: #FFF;
            background: #933; /* for non-css3 browsers */
        }

        #midpane {
            border: 0px solid #880000;
            width: 76.26%;
            padding: 0;
            height: inherit;
            float: right;
            text-align: left;
            overflow: auto; 
            background-color: #F4FAFE;
            border-style: inset;
            border: 2px solid #bbb;
        }

        #midpane ul {
            list-style: none;
            margin:0;
            padding: 0;
        }
        #midpane ul li {
            font-size: 15px;
            line-height: 21px;
            color: #333;
            font-weight: 100;
            padding: 7px 13px 9px 13px;
            border-bottom: 1px solid #333;
            cursor: pointer;    
            background: #EEE; /* for non-css3 browsers */
        }
        #midpane ul li:first-child {
            border-top: 0px solid #999;
        }
        #midpane ul li:hover {
            color: #333;    
            background: #C0CFD6; /* for non-css3 browsers */
        }

        #midpane ul li.midhover {   
            color: #FFF;
            background: #933; /* for non-css3 browsers */
        }
    `,
    DEFAULT_LOGO: `
        data:image/png;base64,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
    `,

    PERSON_BUTTON: `
        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH4wIPFjg7wJgKpwAAAAd0RVh0QXV0aG9yAKmuzEgAAAAMdEVYdERlc2NyaXB0aW9uABMJISMAAAAKdEVYdENvcHlyaWdodACsD8w6AAAADnRFWHRDcmVhdGlvbiB0aW1lADX3DwkAAAAJdEVYdFNvZnR3YXJlAF1w/zoAAAALdEVYdERpc2NsYWltZXIAt8C0jwAAAAh0RVh0V2FybmluZwDAG+aHAAAAB3RFWHRTb3VyY2UA9f+D6wAAAAh0RVh0Q29tbWVudAD2zJa/AAAABnRFWHRUaXRsZQCo7tInAAAENUlEQVRoge2Z3yt7fxzHX5ttKT8Kay5Gk4XVtFqOTImkdklWJiI3i5Xm1wVuyKT4A6il3HCh1XKl1HJDMmrSipSR5NdMNgdTO9jrc/HNvp3PGc45hvVpz3rX6f16vd/v5+Oc997v9zkTICLCPyThbxuIt5JAia4kUKIrCZToSgIlupJAiS7Rbxs4Pz+H7e1t2N3dBYqiQKvVQkVFBRQWFvLrEH9Jz8/PaLVaUSwWIwDQilAoxN7eXgyFQpz7/RWgx8dHJAiCAfJ3USqVeHl5yanvuAEdHR2hw+HA5eVlJEnyw9yuri6G+Z6eHjw8PESNRkOrr6+v5+Tjy0BerxfLy8tpJuRyOc7OzuL+/j5GIhFa/traWsynsbCwgIiIDQ0NjJjdbv8ZIL/fj7m5uR9Om7a2NlqboaEhRk5BQQHqdDpsb2+P2UdLS8vPAA0PD3/6OwAAnJ+fj7apra1lxI1GI1IUhYjImHIAgCqV6meAMjMzWQEZDIZom1iGRSIRhsNhjEQimJaWxohnZGSw9sR7Yw0EAnB/f88q1+VyRa+Li4sZ8ZKSEpBIJHB8fAyhUIgRLy0tZe2LN5DP5+OVG8ucWq0GAIC9vb2Y7bVaLeuxeANdX1+zzk1JSYleWywWyMnJocXT09MBAEAqlUJHRwctlpqaChaLhfVYvI8+Nzc3rHOFwv/vW3Z2NkxOTkJnZ2e0zm63Q35+PkQiEXA6nbS2ExMToFKp2BvjuyDMzMywWhDeyuvra7TtwMDAp/kCgQD7+/tp7diIN5DVauUE9HZ6sNvtCACo0+lwenoaGxsbaec5kUiE1dXVuLKywssXb6CamhpOQOvr64iI+PT0hA8PD7S+gsEgHhwcoNvtxmAwyNcSf6D3ji8fFb1ej+Fw+Etm2YgzEEmSqFQqOQMJBAK02WzfwUCTAJH7x3qSJGFxcRGcTidcXV2B1+uF29tbRp5arQaZTAYEQUBzczOUlZVxHYq74nFXxsbGYj4Vn88Xj+456cvfFO7u7oAgCEa9XC4HmUwGJEl+dQhO4gWEiLC0tARarRZOTk5Ar9dDVlYWLaepqQkEAgGMj4+D2WyG09PTuBhmY46THA4HlpaWMo71JpOJNt1cLhciIm5sbCAAoFgsRpPJhGdnZ3GbXrHECejvHX50dBT9fj8iIq6urkbrFQoFIv635wQCAczLy4vGpFIpbm1txR3kTayBPB7Pu0vy3Nwcvry8RN9eBwcHkaIorKqqiplfWVn5+0AjIyPvAkkkEtzc3MTu7m4EANzZ2UGz2fzhvnRxcfEtQKwXBY/H826MoigwGAxQV1cHRUVF4Ha7wWaz8e7vS2JLrlAoPj0NEASBfX19KJFIPs2dmpr6lifE+n3IaDSyegciSRJaW1s/zdNoNGyH5iReR59E1j/370MSKNGVBEp0JYESXUmgRFcSKNH1B56p9eZ1rypXAAAAAElFTkSuQmCC
    `,

    LIST_SYMBOL: `
        data:image/png;base64,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
    `,

    VOICE_SYMBOL: `
        data:image/png;base64,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
    `
}