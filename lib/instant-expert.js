const InstantExpertHelper = {
    HOST_URL: "https://cdn.jsdelivr.net/gh/uihilab/instant-expert@latest/",
    KEYCODE: {
        ENTER: 13
    },

    template: document.createElement('template'),
    inputPlaceholder: "Type your question and press enter",

    getTemplateHTML: function() {
        return `
            <img id="show-hide-expert" src="${this.HOST_URL}lib/resources/images/person-button.png">
            
            <div id="expert-container">
                    <img id="expert-logo" src="${this.HOST_URL}lib/resources/images/logo-pale.png">
                    <div id="question-box-container">
                        <img   id="list-button"  class="question-button" title      ="Click to see the list of predefined questions" src="${this.HOST_URL}lib/resources/images/listlogo.png">
                        <input id="question-box"                         placeholder="${this.inputPlaceholder}">
                        <img   id="voice-button" class="question-button" title      ="Click to make a voice-enabled search"          src="${this.HOST_URL}lib/resources/images/voicesearchlogo.png">
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
                @import url('${this.HOST_URL}lib/resources/style/knowledge.css')
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