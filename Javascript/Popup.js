var doTranslation = true;

// Register the event handlers.
document.addEventListener('DOMContentLoaded', function () {
	init();
	document.querySelector('#targetLanguage').addEventListener("change", saveChanges, false);
	document.querySelector('#InLine').addEventListener("change", dockPopup, false);
});

// Prepare the popup.
function init(){
	// If target language found, check whether in-line translation is enabled.
	if(getTargetLanguage()){
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendMessage(tab.id, {method: "getTranslatedText"}, function (response) {
				// If in-line translation found, use that text. Otherwise do translation.
				if(response.TranslatedText != ""){
					// Check the In-Line translation checkbox.
					var inLine = document.getElementById("InLine");
					inLine.checked = 'true';
					
					// Display the translated text.
					var text = document.getElementById('TranslatedTextViewer');
					text.innerHTML = localStorage["translatedText"] = response.TranslatedText;
					
					// Display the source language.
					var sourceLanguage = document.getElementById('SourceLanguage');
					sourceLanguage.innerHTML = localStorage["sourceLanguage"] = response.SourceLanguage;
				}
				else{
					translateSelectedText();
				}
			});
		});
	}
}

// Sets the opted language to targetLanguage dropdownlist.
function getTargetLanguage(){
	var storedTardetLanguage = localStorage["targetLanguage"];
	if(storedTardetLanguage == undefined){
		$("#targetLanguage").prepend('<option value="0" selected="selected">--Select--</option>');
		
		var text = document.getElementById('TranslatedTextViewer');
		text.innerHTML = "Please select the target language.";
		doTranslation = false;
			
		$('#loader').removeClass("visible").addClass("hide");
		$('#InLine').removeClass("visible").addClass("hide");
		$('#InLineText').removeClass("visible").addClass("hide");
		
		return false;
	}
	else{
		var select = document.getElementById("targetLanguage");
		for (var i = 0; i < select.children.length; i++) {
			var child = select.children[i];
			if (child.value == storedTardetLanguage) {
				child.selected = "true";
				break;
			}
		}
		return true;
	}
}
				
// To store the selected language.
function saveChanges(){
	var select = document.getElementById("targetLanguage");
	localStorage["targetLanguage"] = select.children[select.selectedIndex].value;
	
	$('#InLine').removeClass("hide").addClass("visible");
	$('#InLineText').removeClass("hide").addClass("visible");
	
	translateSelectedText();
}

// Translates the selected text into opted language and displays it.
function translateSelectedText() {	
	
	// Enable the loading image.
	var loaderImage = document.getElementById("loader");
	loaderImage.style.display = 'block';
	
	// Default the source language to automatic.
	localStorage["sourceLanguage"] = "Automatic";
	
	if(doTranslation){
		chrome.tabs.getSelected(null, function(tab) {
			// Get the selected text. 
		    chrome.tabs.sendMessage(tab.id, { method: "translateSelectedText" }, function (response) {		        
			    if (response.SelectedText) {
			        var select = document.getElementById("targetLanguage");
					$.get('https://translation.googleapis.com/language/translate/v2?key=SecretKeyGoesHere'
						+ '&target=' + select.children[select.selectedIndex].value
						+ '&q=' + response.SelectedText
						, function (result) {							
							result = JSON.parse(result);
							if (result && result.data && result.data.translations && result.data.translations.length) {
								var translation = result.data.translations[0];
								$('#TranslatedTextViewer').html(translation.translatedText);
								localStorage["translatedText"] = translation.translatedText;
								var sourceLang = $('#targetLanguage option[value="' + translation.detectedSourceLanguage + '"]').html();
								$('#SourceLanguage').html(sourceLang);
								localStorage["sourceLanguage"] = sourceLang;
							}    else {
								$('#TranslatedTextViewer').html('');
								$('#SourceLanguage').html('unkown');
							}

							// Disable the loading image.
                            loaderImage.style.display = 'none';
						}, "text");					
				}
				else{
					var text = document.getElementById('TranslatedTextViewer');
					text.innerHTML = localStorage["translatedText"] = "Please select a text to translate.";
					loaderImage.style.display = 'none';
				}
			});
		});
    }
	else{
		var text = document.getElementById('TranslatedTextViewer');
		text.innerHTML = localStorage["translatedText"] = "Please select a text to translate.";
		loaderImage.style.display = 'none';
	}
}

// Dock or Undock the popup to or from the page.
function dockPopup(){
	debugger;
	var inLine = document.getElementById("InLine");
	if(inLine.checked == true){
		chrome.tabs.getSelected(null, function(tab) {		
			chrome.tabs.sendMessage(tab.id, {method: "dockPopup"}, function (response) {});
		});
		window.close();
	}
	else{
		chrome.tabs.getSelected(null, function(tab) {		
			chrome.tabs.sendMessage(tab.id, {method: "undockPopup"}, function (response) {});
		});
	}
}