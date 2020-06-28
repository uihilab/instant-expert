import * as Resources from './resources.js';
import Faq from './components/Faq.js';
import $ from './libraries/jquery/jquery.js';

class InstantExpert extends HTMLElement {

    static get observedAttributes() {
        return ["engine"];
    }

    constructor() {
        super();
        var template = Resources.helper.template;
        var templateHTML = Resources.helper.getTemplateHTML();
        var shadowElement = this.attachShadow({
            mode: 'open'
        })
        template.innerHTML = templateHTML;
        shadowElement.appendChild(template.content.cloneNode(true));
        this._shadowElement = shadowElement;
        this._faq;
        this._mode;

        // Global Event Listeners
        this._listedQuestionOnClick;
    }

    connectedCallback() {
        this.addEventListeners();
        this.processAttributes();

        this._mode = this.mode;

        if(this.mode == "engine"){
            if(!this.engine){
                console.log("InstantExpert: Cannot be initialized. Please check configuration.");
                this._mode = "error";
            }
            return;
        }

        // Don't load FAQ libraries if the mode is not FAQ.
        if(this.faqUrl){
            this._faq = new Faq(this.mode, this.faqUrl, [], this.downloadModel);
            this.setFAQQuestions();
        }
        else{ // custom faq
            let customFaq = this.processCustomFaq();
            this._faq = new Faq(this.mode, 0, customFaq, this.downloadModel);
        }
    }

    processAttributes(){

        /**************New Attribute Group**************/
        // Process attributes for the mode
        // If not specificed, the defaul is 'faq-model'.
        if(!this.mode) this.mode = 'faq-model';

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
        // Hide Expert Container (close button)
        var eventFunction_CloseExpertContainer = function (){
            context.hideByID('#expert-container');
        }
        this.addOnClickFunction('#close-button', eventFunction_CloseExpertContainer);


        /**************New Event Listener**************/
        // Show/Hide IO Window Container
        var eventFunction_FAQWindow = function (){
            context.toggleViewOnClick('.question-list');
            context.toggleViewOnClick('.conversation');
        }
        this.addOnClickFunction('#list-button', eventFunction_FAQWindow);

        // /**************New Event Listener**************/
        // // Show the List of Questions for Each Category
        // var selectQuestionCategory = function (event){
        //     // Get all elements with class="question-list" and hide them
        //     var questionLists = context._shadowElement.querySelectorAll(".question-list");
        //     for (var i = 0; i < questionLists.length; i++) {
        //         questionLists[i].style.display = "none";
        //     }
        //     context.showByID('#'+event.target.id+'-qs');
        // }
        // this.addOnClickFunction('#categories', selectQuestionCategory);

        /**************New Event Listener**************/
        // Select a question from the list, and ask for the answer
        // This variable is global because of future dynamic creations
        this._listedQuestionOnClick = function (event){
            var inputBox = context.getShadowElementById("#question-box");
            inputBox.value = event.target.innerHTML;
            eventFunction_FAQWindow();
            context.postRequest(event.target.innerHTML);
        }
        this.addOnClickFunction('.listed-question', this._listedQuestionOnClick);

        /**************New Event Listener**************/
        // Ask the question that is written into the text box, by pressing Enter key
        var askTextInputQuestion = function (event){
            var keyCode = event.keyCode || event.charCode;
            if(keyCode == Resources.helper.KEYCODE.ENTER){
                event.preventDefault();

                var inputBox = context.getShadowElementById(".question-list");
                if($(inputBox).is(":visible")){
                    eventFunction_FAQWindow();
                }

                let questionText = event.target.value;
                this.value = "";
                context.postRequest(questionText);
            }
        }
        this.addOnKeypressFunction('textarea', askTextInputQuestion);

        /**************New Event Listener**************/
        // Activate voice input by clicking microphone icon
        var activateVoice = function (event){
            window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            if (typeof window.SpeechRecognition !== "undefined") {
              context.askVoiceQuestion();
            } else {
              alert("Speech recognition API is not supported");
            }
        }
        this.addOnClickFunction('#voice-button', activateVoice);

    }

    processCustomFaq(){
        var questions = this.shadowRoot.querySelector('slot[name="questions"]').assignedNodes()[0].children;
        var answers = this.shadowRoot.querySelector('slot[name="answers"]').assignedNodes()[0].children;

        if(questions.length != answers.length){
            return [];
        }

        var qna = [];
        for (var i = 0; i < questions.length; i++) {
            qna.push([questions[i].innerHTML, answers[i].innerHTML]);
        }

        return qna;
    }

    askVoiceQuestion() {
        var inputBox = this.getShadowElementById("textarea");
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
                    $(inputBox).val(interimTranscript);
                    // inputBox.value = interimTranscript;
                }
            }

            if(finalTranscript !== ""){
                inputBox.value = "";
                inputBox.placeholder = Resources.helper.inputPlaceholder;
                this.postRequest(finalTranscript);
            }
        }

        // recognition.onend = function() {
        //     console.log("end");
        //     // start_img.src = 'images/mic.gif';
        //     if (finalTranscript) {
        //         console.log(finalTranscript);
        //         return;
        //     }
        // };

        // Listen for errors
        recognition.onerror = function(event) {
            console.log('Recognition error: ' + event.message);
            inputBox.placeholder = Resources.helper.inputPlaceholder;
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
        var context = this;

        this.addQuestionToConversation(questionText);

        this.showTypingGif();

        if(this._faq){ // if this question is for an FAQ
            this._faq.getFAQResponse(questionText).then(response => {
                context.printResponseCallback(response['answer'], response['confidence']);
            });
        }
        else{
            var dataParams = {};
            dataParams[this.postRequestQuestionKey] = questionText;

            var responseKey = this.postRequestResponseKey;

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
    }

    // TODO: add confidence value as well
    printResponseCallback(response, confidence = -1){
        let conversation = $(this.getShadowElementById(".conversation"));
        let confidencetext = "Instant Expert";

        if(confidence != -1){
            confidencetext = "Instant Expert - Confidence: "+confidence+"%";
        }

        this.hideTypingGif();

        // Append a new div to the conversation body, with an image and the text from API.AI
        conversation.append(
            $('<div/>', {'class': 'chat expert'}).append(
                $('<div/>', {'class': 'expert-photo'}).append($('<img src="'+Resources.visuals.DEFAULT_LOGO+'" />')),
                $('<div/>', {'class': 'response-container'}).append(
                    $('<div/>', {'class': 'confidence-container'}).append(
                        $('<span/>', {'id': 'confidenceLevel', 'text': confidencetext})),
                    $('<p/>', {'class': 'chat-message', 'text': response}))));

        this.scrollBottom();
    }


    addQuestionToConversation(questionText){
        let conversation = $(this.getShadowElementById(".conversation"));
        conversation.append(
            $('<div/>', {'class': 'chat self'}).append(
                $('<p/>', {'class': 'chat-message', 'text': questionText})));

        this.scrollBottom();
    }

    scrollBottom(){
        let conversation = $(this.getShadowElementById(".conversation"));
        conversation.stop().animate({scrollTop: conversation[0].scrollHeight});
    }

    showTypingGif(){
        let conversation = $(this.getShadowElementById(".conversation"));
        let typingGif = $(this.getShadowElementById("#typingGif"));
        conversation.append(typingGif);
        typingGif.css("display", "flex");
    }

    hideTypingGif(){
        let typingGif = $(this.getShadowElementById("#typingGif"));
        typingGif.css("display", "none");
    }

    // Generates a question list out of parsed FAQ
    async setFAQQuestions(){
        await this._faq.waitUntilLoaded();
        let questionList = this._faq.getFAQQuestionsWithCategory();
        this.setQuestions(questionList);
    }

    /***********************Public Functions***********************/
    /**************************************************************/
    setQuestions(questionList){
        let faqBlock = $(this.getShadowElementById(".question-list"));

        // Reset any existing questions
        faqBlock.html("");

        for (let [index, questionBlock] of questionList.entries()) {
            faqBlock.append(
                $('<div/>', {'class': 'category', 'text': questionBlock[0]}));

            for (let [indexQ, question] of questionBlock[1].entries()) {
                faqBlock.append(
                    $('<p/>', {'class': 'listed-question', 'text': question}).click(this._listedQuestionOnClick));
            }
        }
    }

    faqOnload(onloadFunction){

    }

    /**************Getter/Setter and Helper Functions**************/
    /**************************************************************/
    get engine() {
        return this.getAttribute('engine');
    }

    set engine(newValue) {
        this.setAttribute('engine', newValue);
    }

    get mode() {
        return this.getAttribute('mode');
    }

    set mode(newValue) {
        this.setAttribute('mode', newValue);
    }

    get faqUrl() {
        return this.getAttribute('faq-url');
    }

    set faqUrl(newValue) {
        this.setAttribute('faq-url', newValue);
    }

    get downloadModel() {
      return this.hasAttribute('downloadModel');
    }

    set downloadModel(downloadModelFlag) {
      if (downloadModelFlag) {
        this.setAttribute('downloadModel', '');
      } else {
        this.removeAttribute('downloadModel');
      }
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
