"use strict";

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('xc.html', {
    'width': 820,
    'height': 640,
    'resizable': false,
  });
});
