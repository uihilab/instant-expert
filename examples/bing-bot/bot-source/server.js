const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/', (req, res) => processPostRequest(req, res));
app.get('/', (req, res) => processGetRequest(req, res));


var getOptions = function(pQuestion){
  // Configure the request to connect Microsoft Cognitive Services
  
  let host = 'https://api.labs.cognitive.microsoft.com';
  let path = '/answerSearch/v7.0/search';
  let params = '?q=' + encodeURI(pQuestion) + '&mkt=en-us';
  var options = {
      url: host + path + params,
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.MS_PROJECT_ANSWER_SEARCH_KEY,
      }
  };
  
  return options;
};

var processGetRequest = function(pRequest, pResponse){
  generateResponse("Welcome to the Microsoft Project Answer Search! Please use this link to make POST requests with a question to get the instant answer.", pResponse);
};

var processPostRequest = function(pRequest, pResponse){
  var question = pRequest.body.question;
  
  var options = getOptions(question);
  request(options, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        let body_ = JSON.parse(body);
        let answer = "Sorry, I don't know the answer to that.";
        if(body_.facts != null){
          answer = body_.facts.value[0].description; 
        }
        else if(body_.webPages != null){
          answer = body_.webPages.value[0].snippet;
        }
        generateResponse(answer, pResponse);
      }
      else{
        generateResponse("Sorry, I'm having difficulties retrieving the information you've requested.", pResponse);
      }
  });
};

var generateResponse = function(pAnswer, pResponse){
  let response = {'resultText': pAnswer};
  let response_ = JSON.stringify(response);
  pResponse.end(response_);
};

app.listen(process.env.PORT || 3000);
