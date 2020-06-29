import $ from '../libraries/jquery/jquery.js';
// import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js';
// import '../libraries/tf/tf.min.js';

export default class Faq {
    constructor(p_mode, p_faqURL = 0, p_customFaq = [], p_downloadModelFlag = false) {
        this.mode = p_mode;
        this.faqURL = p_faqURL;
        this.downloadModelFlag = p_downloadModelFlag; // boolean
        this.loaded = false;
      	this.faq = p_customFaq;
        this.model;
        this.faqEmbeddings = [];
        this.similarityThreshold = 0.75;

        // Enable only for debugging and record keeping
        this.developerMode = true;

        // Enable only for benchmarking runtime
        this.benchmarkMode = false;

        this.initialize();

   	}

    initialize(){
        var context = this;
        // Load Dependencies and process FAQ
        // TODO: Import these libraries with ES6 style in the future
        // We are loading these dynamically because of bundling issues with webpack
        $.when(
                $.getScript( "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js" ),
                $.Deferred(function( deferred ){
                    $( deferred.resolve );
                })
        ).done(function(){
            $.when(
                $.getScript( "https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder" ),
                $.getScript( "https://cdn.jsdelivr.net/npm/mathjs@7.0.0/dist/math.min.js" ),
                $.Deferred(function( deferred ){
                    $( deferred.resolve );
                })
            ).done(function(){
                console.log("InstantExpert: All faq dependencies are loaded.");

                if(context.mode == "faq-web" && context.faqURL!=0){
                    context.getFAQFromURL(context.faqURL);
                }
                else if(context.mode == "faq-custom" && context.faq.length){
                    context.getCustomFaq();
                }
                else if(context.mode == "faq-model" && context.faqURL!=0){
                    context.getFaqFromModel();
                }
                else{
                    console.log("InstantExpert: Cannot be initialized. Please check configuration.");
                }
            });
        });
    }

    async getFAQResponse(questionText){
        if(this.faq.length == 0){
            return {'answer' : "This service is not available right now.", 'confidence': 0};
        }
        if(this.faqEmbeddings.length == 0){
            return {'answer' : "System loading; please try again in 5 seconds!", 'confidence': 0};
        }

        const inputEmbedding = await this.embedAQuestion(questionText);
        return this.mapToFAQ(inputEmbedding[0]);
    }

    // Finds the best match between the input question and the FAQ
    // It uses Cosine Distance to assesss similarity
    mapToFAQ(inputEmbedding){
        var inputNorm = math.norm(inputEmbedding);
        var questionNorm, dotProduct;
        var similarityArray = [];
        var response = {'answer' : "", 'confidence': 0};
        
        for (var i = 0; i < this.faqEmbeddings.length; i++) {
            questionNorm = math.norm(this.faqEmbeddings[i]);
            dotProduct = math.dot(inputEmbedding, this.faqEmbeddings[i]);
            similarityArray.push(dotProduct/(inputNorm*questionNorm));
        }

        const mostSimilarIndex = similarityArray.indexOf(Math.max(...similarityArray));

        if(this.developerMode){
            console.log("InstantExpert: Most similar question's similarity score: ", similarityArray[mostSimilarIndex]);
        }

        response['confidence'] = Math.floor(similarityArray[mostSimilarIndex] * 100);

        if(similarityArray[mostSimilarIndex] >= this.similarityThreshold){
            let qnaCouple = this.faq[mostSimilarIndex];
            response['answer'] = qnaCouple[1];
        }
        else{
            response['answer'] = "I'm sorry! I don't know the answer to that question."; 
        }

        return response;
    }

    getCustomFaq(){
        const matrixColumn = (arr, n) => arr.map(x => x[n]);
        let questions = matrixColumn(this.faq, 0);

        this.embedQuestions(questions);
    }

    // Get FAQ pairs and save as a matrix
    // work only once at page load
    getFAQFromURL(faqURL){
        var context = this;

        var extractedFAQ;

        var parsingRuntimeStart;

        $.get(faqURL, function(data, status){
            if(context.benchmarkMode){
                parsingRuntimeStart = performance.now();
            }

            // Use browser to get html content
            // This code is the reason that provided URL has to belong
            // to a trusted source. Otherwise, it may harm the user.
            let tmp = document.createElement("DIV");
            tmp.innerHTML = data;
            let faqStart, faqEnd, allFaqElements;

            // All HTML elements whose innerText contains a question mark
            // Return only the deepest elements (unique)
            let elementsWithQuestionMark = $(tmp).find(":contains('?'):not(:has(:contains('?')))");

            let questionElementIdentifiers = new Map();
            let questionElementIdentifierFrequency = new Map();
            let depth, parent1, parent2, parent3, parent4, parents;

            $(elementsWithQuestionMark).each(function(element){
                parents = $(this).parents();

                depth = parents.length;
                parent1 = parents[0] ? parents[0].tagName : "";
                parent2 = parents[1] ? parents[1].tagName : "";
                parent3 = parents[2] ? parents[2].tagName : "";
                parent4 = parents[3] ? parents[3].tagName : "";

                let questionRecognizer = new Map();
                questionRecognizer.set('depth', depth);
                questionRecognizer.set('self', $(this).prop("tagName"));
                questionRecognizer.set('parent1', parent1);
                questionRecognizer.set('parent2', parent2);
                questionRecognizer.set('parent3', parent3);
                questionRecognizer.set('parent4', parent4);

                let identifierKey = Array.from(questionRecognizer.values()).join('');

                questionElementIdentifiers.set(identifierKey,questionRecognizer);

                if(!questionElementIdentifierFrequency.has(identifierKey)){
                    questionElementIdentifierFrequency.set(identifierKey, 0);
                } else{
                    questionElementIdentifierFrequency.set(identifierKey, 
                                                            questionElementIdentifierFrequency.get(identifierKey)+1);
                }
            });

            let qElementIDKeys_array = Array.from(questionElementIdentifierFrequency.keys());
            let mostCommonIdentifierIndex = context.indexOfHighest(Array.from(questionElementIdentifierFrequency.values()));
            let mostCommonidentifierKey = qElementIDKeys_array[mostCommonIdentifierIndex];
            // mostCommonIdentifier represents the selected element properties
            // that constitute a question in the FAQ
            let mostCommonIdentifier = questionElementIdentifiers.get(mostCommonidentifierKey);

            let questionSelector = "";
            if(mostCommonIdentifier.get('parent4') !== ""){
                questionSelector = mostCommonIdentifier.get('parent4') + ">" 
                                    + mostCommonIdentifier.get('parent3') + ">" 
                                    + mostCommonIdentifier.get('parent2') + ">" 
                                    + mostCommonIdentifier.get('parent1') + ">" 
                                    + mostCommonIdentifier.get('self');
            }
            else if(mostCommonIdentifier.get('parent3') !== ""){
                questionSelector = mostCommonIdentifier.get('parent3') + ">" 
                                    + mostCommonIdentifier.get('parent2') + ">" 
                                    + mostCommonIdentifier.get('parent1') + ">" 
                                    + mostCommonIdentifier.get('self');
            }
            else if(mostCommonIdentifier.get('parent2') !== ""){
                questionSelector = mostCommonIdentifier.get('parent2') + ">" 
                                    + mostCommonIdentifier.get('parent1') + ">" 
                                    + mostCommonIdentifier.get('self');
            }
            else if(mostCommonIdentifier.get('parent1') !== ""){
                questionSelector = mostCommonIdentifier.get('parent1') + ">" 
                                    + mostCommonIdentifier.get('self');
            }
            else{
                questionSelector = mostCommonIdentifier.get('self');
            }

            // let questionSelector = mostCommonIdentifier.get('parent4') + ">" 
            //                         + mostCommonIdentifier.get('parent3') + ">" 
            //                         + mostCommonIdentifier.get('parent2') + ">" 
            //                         + mostCommonIdentifier.get('parent1') + ">" 
            //                         + mostCommonIdentifier.get('self');

            // All questions have successfully been parsed.
            let questionCandidates = $(tmp).find(questionSelector).filter(function(){
                return $(this).parents().length == mostCommonIdentifier.get('depth') && 
                       $(this).text() !== "";
            });


            // Save extracted question texts
            extractedFAQ = Array(questionCandidates.length).fill().map(()=>["",""]);
            questionCandidates.each(function(qcIndex){
                extractedFAQ[qcIndex][0] = $(this).text();
            });


            // For debugging purposes
            if(context.developerMode){
                console.log("InstantExpert: Parsed Questions Only", extractedFAQ);
                // context.downloadFAQAsCSV();
            }

            /************* QUESTIONS HAVE BEEN PARSED *********************/
            /************* NOW, WE NEED THEIR CONTAINERS *********************/


            // nextUntil function only works for siblings and children so we should find the 
            // question element's closest parent that is a sibling to the element(s) that 
            // containt the answer.
            // 
            // Challenge: Since many questions are in different scope, we can't simply
            // take any text between two questions. For example, the last question of the
            // 1st group and the first questions of the 2nd group creates an issue.
            // 
            // Solution: Apply this method anyway, which will result in the majority as
            // accurately, and not accurate for some. Create a hash table to measure 
            // majority's pattern in terms of -html tag-(no need) and distance from the original question.
            // 
            // Once the pattern is discovered, just reparse all questions for ~100% accuracy.
            let containerDepths = [];
            $(questionCandidates).each(function(qcIndex){
                let questionCandidate = this;
                let questionContainerDistance = 0;

                // Ignore last question
                if(questionCandidates.length == qcIndex+1) return;

                let nextElement = $(questionCandidates[qcIndex+1]);
                $(questionCandidate).parents().each(function(index){
                    if(!$(this).text().includes(nextElement.text())){ // find the uppermost element that doesnt contain the next question
                        questionContainerDistance++;
                    }
                    else{
                        return;
                    }
                });

                containerDepths.push(questionContainerDistance);
            });



            const containerDepthFreq = containerDepths.reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map());
            let inferredContainerDepth = [...containerDepthFreq.entries()].reduce((x, y) => y[1] > x[1] ? y : x)[0];

            // Now, really get the question containers based on our inferred parent element
            let questionContainers = [];
            $(questionCandidates).each(function(qcIndex){
                if(inferredContainerDepth == 0){
                    questionContainers.push(this);
                }else{
                    questionContainers.push($(this).parents().eq(inferredContainerDepth-1));
                }
            });


            /************* QUESTIONS ARE FULLY PROCESSED ***********/
            /************* NOW, THE ANSWERS... *********************/

            let currentQuestion, nextQuestion, extractedAnswer = "";

            // Boolean - If true, it means innermost question elements are plainly coded in the same scope.
            let allQuestionsAreSiblings = $(questionCandidates[0]).siblings().is($(questionCandidates[1]));
            questionContainers.forEach(function(questionContainer, qcIndex){
                extractedAnswer = "";
                currentQuestion = $(questionContainer);

                // This is great, it means all questions are contained,
                // so we can just go ahead and parse the answers.
                // 
                // (TODO-Fix) This still misses a edge case where the question is contained,
                // but the answer is still a seperate element outside the container.
                if(!allQuestionsAreSiblings){
                    // TODO: Maybe also remove the unnecessary html elements
                    // This is practically not important, so it's fine either way.
                    currentQuestion.find(questionCandidates[qcIndex]).remove();

                    // Answer text extracted from the question container's scope.
                    currentQuestion.each(function(index){
                        extractedAnswer += ($(this).text()+"\n");
                    });
                    extractedFAQ[qcIndex][1] = extractedAnswer;
                }
                else{
                    // In this case, we can just use the nextUntil to get the answer
                    // as the elements between two questions. The last question remains
                    // unanswered.
                    
                    // Last question may be answered partially (TODO-Fix)
                    if(questionContainers.length == qcIndex+1) {
                        extractedFAQ[qcIndex][1] = currentQuestion.next().text();
                        return;
                    }
                    nextQuestion = $(questionContainers[qcIndex+1]);

                    let answerElements = currentQuestion.nextUntil(nextQuestion);

                    // Answer text extracted outside of the question container's scope.
                    answerElements.each(function(index){
                        extractedAnswer += ($(this).text()+"\n");
                    });
                    extractedFAQ[qcIndex][1] = extractedAnswer;
                }

                // TODO: Answer text extracted out of the question container's scope
                // ****************************************************************
                // // Ignore last question for now (TODO-Fix)
                // if(questionContainers.length == qcIndex+1) return;
                // nextQuestion = $(questionContainers[qcIndex+1]);

                
                // if(currentQuestion.siblings().is(nextQuestion)){
                //     // let temp = currentQuestion.children().filter(function() {
                //     //     if($(this).text().includes(currentQuestionText))
                //     //         return $(this);
                //     // });
                //     // console.log(temp);
                //     // console.log("here: ", currentQuestion.find(":not(:contains("+currentQuestionText+")"));
                //     // let answerElements = currentQuestion.nextUntil(nextQuestion);
                //     // console.log(answerElements);
                // }
                // else{
                //     // collect the latest questions in their group
                // }
            });


            // Clean noise, if any
            let removedCount = 0;
            extractedFAQ.forEach(function(extractedFAQCouple, qcIndex){
                if(extractedFAQCouple[0] === ""){
                    extractedFAQ.splice(qcIndex-removedCount, 1);
                    // removedCount++;
                }
            });

            // For benchmarking purposes
            if(context.benchmarkMode){
                console.log("InstantExpert: Runtime for FAQ parsing (in miliseconds): ", performance.now() - parsingRuntimeStart);
            }


            // Save extracted FAQ
            context.faq.push(...extractedFAQ);

            // For debugging purposes
            if(context.developerMode){
                console.log("InstantExpert: Parsed FAQ couples", extractedFAQ);
                // context.downloadFAQAsCSV();
            }

            let questions = context.matrixColumn(extractedFAQ, 0);

            context.embedQuestions(questions);

        }).fail(function() {
            console.log('There is an issue with the FAQ URL.');
        });
    }

    // Creates a Question&Answer matrix from FAQ text
    // Input: FAQ text provided as 1D array
    parseFaqText(faqText){
        // Current approach: Divide by question marks
        
        var currentQnA = [];
        var qnaIndex = -1;
        for (var i = 0; i < faqText.length; i++) {
            if(faqText[i].includes('?')){
                qnaIndex++;
                currentQnA.push(["",""]);
                currentQnA[qnaIndex][0] = faqText[i];
            }
            else if(qnaIndex >= 0){ // found at least one Q&A
                currentQnA[qnaIndex][1] += faqText[i];
            }
        }

        return currentQnA;
    }

    // Embed all FAQ once at initilization, and save the resulting vector
    // Initialize model
    embedQuestions(questions){
        // For benchmarking purposes
        // Measure embedding time
        var embeddingRuntimeStart;

        // Embed an array of questions.
        use.load().then(model => {
          this.model = model;

            if(this.benchmarkMode){
                embeddingRuntimeStart = performance.now();
            }
          model.embed(questions).then(async embeddings => {
            // `embeddings` is a 2D tensor consisting of the 512-dimensional embeddings for each sentence.
            // So in this example `embeddings` has the shape [2, 512].
            const vectorFaq = await embeddings.array();
            this.faqEmbeddings.push(...vectorFaq);

            // For debugging purposes
            if(this.benchmarkMode){
                console.log("InstantExpert: Runtime for FAQ embedding (in miliseconds): ", performance.now() - embeddingRuntimeStart);
            }

            // If downloadModel attribute is true, then download
            // the model for FAQ as a JSON file
            if(this.downloadModelFlag) {
                this.downloadModel();
            }

            this.loaded = true;
          });
        });
    }

    // This function is assumed to be called after successful initilatization of TF model
    async embedAQuestion(question){
        var vectorQuestion;

        if(!this.model){
            this.model = await use.load();
        }

        await this.model.embed(question).then(async embeddings => {
          vectorQuestion = await embeddings.array();
        });
        return vectorQuestion;
    }

    downloadModel(){
        var obj = {faq: this.faq, embeddings: this.faqEmbeddings};
        var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));

        $('<a href="data:' + data + '" download="instantexpert_faq.json"></a>').appendTo('instant-expert')[0].click();
    }

    getFaqFromModel(){
        var context = this;
        $.getJSON(context.faqURL, function(data, status){
            context.faq = data['faq'];
            context.faqEmbeddings = data['embeddings'];
            context.loaded = true;
        }).fail(function() {
            console.log('There is an issue with the FAQ URL or JSON structure.');
        });
    }

    // Getters and Helpers
    getFaq(){
      return this.faq;
    }

    matrixColumn(arr, n){
        return arr.map(x => x[n]);
    }

    setConfidenceThreshold(confidence){
      this.similarityThreshold = confidence;
    }

    indexOfHighest(a) {
        var highest = 0;
        for (var i = 1; i < a.length; i++) {
            if (a[i] > a[highest]) highest = i;
        }
        return highest;
    }

    waitUntilLoaded() {
      const poll = resolve => {
        if(this.loaded) resolve();
        else setTimeout(_ => poll(resolve), 400);
      }
      return new Promise(poll);
    }

    getFAQQuestionsWithCategory(){
        let questionList = [];
        let questionListBlock = [];
        questionListBlock.push("General FAQ");
        questionListBlock.push(this.matrixColumn(this.faq,0));
        questionList.push(questionListBlock);
        return questionList;
    }

    // Development Mode Functions
    
    downloadFAQAsCSV(){
        // let dataPreprocessed = this.faq.map(row => row.map(item => item.replace(/[\u2018\u2019]/g, "'")));
        let data = this.faq.map(row => row.map(item => (typeof item === 'string') ? `"${item}"`: String(item)).join(',')).join('\n');
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + data;
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "faq.csv");
        document.body.appendChild(link); // Required for FF

        link.click();          
    }

    // downloadFAQAsJSON(){
    //     var obj = {faq: this.faq};
    //     var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));

    //     $('<a href="data:' + data + '" download="faq.json"></a>').appendTo('instant-expert')[0].click();
    // }

}
