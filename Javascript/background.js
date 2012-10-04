// Handle the requests.
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.method == "setTargetLanguage"){
	  localStorage['targetLanguage'] = request.theTargetLanguage;
	  sendResponse({TargetLanguage: localStorage['targetLanguage']});	  
	}
	else if(request.method == "getTranslatedText"){
	  sendResponse({TranslatedText: localStorage['translatedText'],
					TargetLanguage: localStorage["targetLanguage"],
					SourceLanguage: localStorage["sourceLanguage"]});
	}
	else
	  sendResponse({}); // snub them.
});