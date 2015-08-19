var topBarScript = "Javascript/TopBar.js";
var jqueryScript = "Javascript/References/jquery-2.1.4.min.js";
var topBarPage = "TopBar.html";

function GetSelectedText() {
    var selectedText = (window.getSelection
		? window.getSelection() : document.getSelection
        ? document.getSelection() : document.selection.createRange().text
    );

    if (!selectedText || selectedText == "") {
        if (document.activeElement.selectionStart) {
            selectedText = document.activeElement.value.substring(
            document.activeElement.selectionStart.
            document.activeElement.selectionEnd);
        }
    }
    return selectedText;
}

// Handle the requests.
chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.method == "translateSelectedText") {
        sendResponse({ SelectedText: GetSelectedText().toString() });
    }
    else if (request.method == "getTranslatedText") {
        var text = document.getElementById('TranslatedTextViewer');
        if (text != null) {
            var sourceLanguage = document.getElementById('SourceLanguage');
            sendResponse({ TranslatedText: text.innerHTML, SourceLanguage: sourceLanguage.innerHTML });
        }
        else {
            sendResponse({ TranslatedText: "" });
        }
    }
    else if (request.method == "dockPopup") {
        injectPopupToPage();
    }
    else if (request.method == "undockPopup") {
        removePopupFromPage();
    }
});

// Do In-Line Translation.
document.addEventListener('mouseup', function (e) {

    var topbar = document.getElementById('topbar');
    if (topbar != null) {
        var selectedText = GetSelectedText().toString();

        var select = document.getElementById("targetLanguage");

        if (selectedText) {
            chrome.extension.sendMessage({ method: "setTargetLanguage", theTargetLanguage: select.children[select.selectedIndex].value },
			function (response) {
			    $.get('https://translate.google.com/translate_a/single?client=t&hl=en&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8&oe=UTF-8'
                     + '&sl=auto'
                     + '&tl=' + response.TargetLanguage
                     + '&q=' + selectedText
                    , function (translatedRawData) {

                        // IMPORTANT: eval is evil but we trust google response :)
                        var translatedData = eval(translatedRawData);

                        // Set the source language.
                        var sourceLanguage = document.getElementById('SourceLanguage');

                        if (translatedData && translatedData.length && translatedData[0].length && translatedData[0][0].length) {
                            $('#TranslatedTextViewer').html(translatedData[0][0][0]);
                            if (translatedData.length >= 3) {
                                var sourceLang = $('#targetLanguage option[value="' + translatedData[2] + '"]').html();
                                $('#SourceLanguage').html(sourceLang);
                            }
                        } else {
                            $('#TranslatedTextViewer').html('');
                            $('#SourceLanguage').html('unkown');
                        }

                    }, "text");
			});
        }
    }
}, false);

// Add the popup/topbar to page
function injectPopupToPage() {

    // Create script element
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = chrome.extension.getURL(topBarScript);

    // Append top bar script to page header.
    $('head').append(script);

    script.src = chrome.extension.getURL(jqueryScript);

    // Append jquery to page header.
    $('head').append(script);

    // Move the page down.
    $('body').css('marginTop', '39px');
    $('body').css('padding-top', '64px');

    // Append the top bar to page.
    $('body').prepend('<div  id="topbar"></div >');
    $('#topbar').load(chrome.extension.getURL(topBarPage));

    $('#topbar').css({
        'background-color': '#FBC619',
        'position': 'fixed',
        'left': '0',
        'top': '0',
        'width': '100%',
        'z-index': '9999'
    });

    // Load already translated text.
    chrome.extension.sendMessage({ method: "getTranslatedText" }, function (response) {
        // Set the target language.
        var select = document.getElementById("targetLanguage");
        for (var i = 0; i < select.children.length; i++) {
            var child = select.children[i];
            if (child.value == response.TargetLanguage) {
                child.selected = "true";
                break;
            }
        }

        // Set the source language.
        var sourceLanguage = document.getElementById('SourceLanguage');
        sourceLanguage.innerHTML = response.SourceLanguage;

        var text = document.getElementById('TranslatedTextViewer');
        text.innerHTML = response.TranslatedText;
    });
}

// Remove the Popup/Topbar from page.
function removePopupFromPage() {
    $('#topbar').remove();
    $('body').removeAttr('style');
}