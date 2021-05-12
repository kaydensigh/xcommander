'use strict';

function openMap() {
  var input = document.getElementById('importMapInput');
  input.value = '';
  input.click();
}

function openPng() {
  var input = document.getElementById('importPngInput');
  input.value = '';
  input.click();
}

function readFile() {
  var file = this.files[0];
  var type = file.name.toLowerCase().match(/\.(\w\w\w)$/)[1];
  var reader = new FileReader();
  reader.onerror = function () {
    console.log('Error reading file: ' + file.name);
  }
  reader.onload = function () {
    if (type == 'map') {
      renderMap(reader.result);
    } else if (type == 'png') {
      renderPng(file.name.match(/([^\/]+)\.\w\w\w$/)[1],
                reader.result);
    }
    console.log('Load complete: ' + file.name);
  };
  if (type == 'map')
    reader.readAsText(file);
  else if (type == 'png')
    reader.readAsDataURL(file);
}

// Support original XCommander .MAP format.
// First line is title.
// Second line is author.
// Third line is 4800 digits: 80x60 pixels at 3 bpp.
function renderMap(fileData) {
  var parts = fileData.split('\r\n');
  title.value = parts[0]; 
  author.value = parts[1]; 
  var data = parts[2]; 
  if (data.length != 4800) {
    console.log('Wrong data length: ' + data.length);
    return;
  }
  for (var y = 0; y < 60; y++) {
    for (var x = 0; x < 80; x++) {
      context.fillStyle = getFillStyle(data[x + y * 80]);
      context.fillRect(x, y, 1, 1);
    }
  }
  updateMapInURL();
}

function getFillStyle(digit) {
  var ci = parseInt(digit);
  if (ci < 0 || ci > 7) ci = 0;
  return colorFillStyle[ci];
}

// Generate map from png.
// Guess title and author from filename.
// Drop to 3 bpp by changing each pixel to the nearest allowed color.
function renderPng(fileName, fileData) {
  var parts = (fileName + '  ').split('  ');
  title.value = parts[0];
  author.value = parts[1];

  var png = new Image();
  png.onload = function () {
    context.drawImage(png, 0, 0);
    for (var y = 0; y < 60; y++) {
      for (var x = 0; x < 80; x++) {
        var c = getMapColor(context.getImageData(x, y, 1, 1).data);
        context.fillStyle = colorFillStyle[c];
        context.fillRect(x, y, 1, 1);
      }
    }
    updateMapInURL();
  }
  png.src = fileData;
}

// Save to original XCommander .MAP format.
function saveMap() {
  exportLink.href = URL.createObjectURL(getCanvasAsMap());
  exportLink.download = title.value + '  ' + author.value + '.map';
  exportLink.click()
}

function savePng() {
  exportLink.href = URL.createObjectURL(getCanvasAsPng());
  exportLink.download = title.value + '  ' + author.value + '.png';
  exportLink.click()
}

function getCanvasAsMap() {
  var output = [title.value, '\r\n', author.value, '\r\n'];
  getMapData(output);
  output.push('\r\n');
  return new Blob([output.join('')], {'type': 'text/plain'});
}

// Get an allowed color that is nearest in rectilinear RGB space.
function getMapColor(pixelData) {
  return colors.map(function (color) {
    return color.map(function (channelValue, channelIndex) {
      return channelValue - pixelData[channelIndex];
    }).reduce(function (accumulator, difference) {
      return accumulator + difference * difference;
    }, 0);
  }).reduce(function (best, distance, index, distances) {
    return distance < distances[best] ? index : best;
  }, 0);
}

// Get a Blob that can be downloaded as a png.
function getCanvasAsPng() {
  var byteString = atob(canvas.toDataURL().split(',')[1]);
  var intArray = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++)
    intArray[i] = byteString.charCodeAt(i);
  return new Blob([intArray], {'type': 'image/png'});
}

// Load a built-in map.
function selectMap(event) {
  var img = event.toElement.children[0];

  var fileName = decodeURI(img.src).match(/.*\/([^\/]+)\.\w\w\w$/)[1];
  var parts = (fileName + '  ').split('  ');
  title.value = parts[0];
  author.value = parts[1];

  context.drawImage(img, 0, 0);
  updateMapInURL();
}

function selectPlayers(event) {
  try {
    var p = event.target.textContent.match(/^(\d)/)[1];
  } catch (e) { }
  setPlayerCount(p);
}

function setPlayerCount(p) {
  updatePlayerCount(p);
  setupPlayers();
}

// Highlight keys based on the number of players.
// The gamepads are also shown if available. 
// Gamepads are assigned in reverse order so they can be mixed with keyboard players.
function setupPlayers() {
  var playerCountStr = getPlayerCountString();
  var playerCountInt = parseInt(playerCountStr);
  if (playerCountInt != 2 && playerCountInt != 3 && playerCountInt != 4) {
    playerCountInt = 2;
    setPlayerCount('2');
    return;
  }

  buildPlayerByKey(playerCountInt);
  updateKeyboard();

  [0, 1, 2, 3].forEach(function (index) {
    var gamepadIndex = playerCountInt - index - 1;
    var gamepadLeft = document.getElementById('player' + index + 'gamepadleft');
    var gamepadRight =
        document.getElementById('player' + index + 'gamepadright');
    if (gamepadManager.gamepads[gamepadIndex]) {
      gamepadLeft.src = 'sprites/gamepadleft' + (gamepadIndex + 1) + '.png';
      gamepadRight.src = 'sprites/gamepadright' + (index + 1) + '.png';
      gamepadLeft.style.display = 'initial';
      gamepadRight.style.display = 'initial';
    } else {
      gamepadLeft.style.display = 'none';
      gamepadRight.style.display = 'none';
    }
  });
}

function buildPlayerByKey(playerCount) {
  playerByKey = new Map();
  for (const [p, playerKeys] of keyMap.entries()) {
    if (p == playerCount) break;
    playerByKey.set(playerKeys.forward, [p, '↑']);
    playerByKey.set(playerKeys.left, [p, '⟲']);
    playerByKey.set(playerKeys.right, [p, '⟳']);
  }
}

function updateKeyboard() {
  const layout = KeycodeLayoutData.layouts[layoutList[likelyLayout]];
  keyboard.textContent = '';
  for (let row of layout) {
    let rowDiv = document.createElement('div');
    rowDiv.classList.add('keyboard-layout-row');
    keyboard.appendChild(rowDiv);
    for (const [code, _, offset, width] of row) {
      let keySpan = document.createElement('span');
      keySpan.classList.add('keyboard-layout-key');
      keySpan.style.setProperty("--key-rel-offset", offset);
      keySpan.style.setProperty("--key-rel-width", width);
      const playerKey = playerByKey.get(code);
      if (playerKey) {
        keySpan.classList.add('p' + (playerKey[0] + 1));
        keySpan.textContent = playerKey[1];
      }
      rowDiv.appendChild(keySpan);
    }
  }
}

function chooseLayout() {
  // Pick the first layout that has all the codes seen so far.
  for (const [l, name] of layoutList.entries()) {
    const layoutLookup = KeycodeLookup.layouts.get(name);
    if (!layoutLookup) {
      console.log('Layout not found: ' + name);
      continue;
    }
    let ok = true;
    for (const code of codesSeen) {
      if (!layoutLookup.has(code)) {
        ok = false;
        break;
      }
    }
    if (ok) {
      likelyLayout = l;
      updateKeyboard();
      return true;
    }
  }
  console.log('No layout contains all codes seen: ');
  console.log(codesSeen);
  return false;
}

function chooseInitialLayout() {
  // The initial key mapping could be anything and might not be possible on the current keyboard.
  // We don't know what keyboard the user has though, so pick the best layout based on these keys.
  // Then reset `codesSeen` so we can pick a better one based on actual KeyboardEvents.
  keyMap = validateKeyMappings();
  for (const [p, playerKeys] of keyMap.entries()) {
    codesSeen.add(playerKeys.forward);
    codesSeen.add(playerKeys.left);
    codesSeen.add(playerKeys.right);
  }
  chooseLayout();
  codesSeen = new Set();
}

let layoutList = ['Standard 101', 'Alternate 101', 'Standard 102', 'Korean 103', 'Brazilian 104', 'Japanese 106', 'Apple'];
let likelyLayout = 0; // Which of the list above is likely given the codes we've seen.
let codesSeen = new Set();

let keyboard = document.getElementById('keyboard');
let keyMap = [];
let playerByKey = new Map();
chooseInitialLayout();

var title = document.getElementById('title');
var author = document.getElementById('author');
var exportLink = document.getElementById('exportLink');
var canvas = document.getElementById('c');
canvas.width = 80;
canvas.height = 60;
var context = canvas.getContext('2d');
context.fillStyle = colorFillStyle[0];
context.fillRect(0, 0, 80, 60);

title.addEventListener('change', updateTitleAuthorInURL);
author.addEventListener('change', updateTitleAuthorInURL);
document.getElementById('mapList').addEventListener('click', selectMap);
document.getElementById('openMap').addEventListener('click', openMap);
document.getElementById('openPng').addEventListener('click', openPng);
document.getElementById('importMapInput').addEventListener('change', readFile, false);
document.getElementById('importPngInput').addEventListener('change', readFile, false);
document.getElementById('saveMap').addEventListener('click', saveMap);
document.getElementById('savePng').addEventListener('click', savePng);
document.getElementById('2Players').addEventListener('click', selectPlayers);
document.getElementById('3Players').addEventListener('click', selectPlayers);
document.getElementById('4Players').addEventListener('click', selectPlayers);
document.getElementById('start').addEventListener('click', startGame);

var gamepadManager = new Gamepad();
gamepadManager.init();
gamepadManager.bind(Gamepad.Event.CONNECTED, setupPlayers);
gamepadManager.bind(Gamepad.Event.DISCONNECTED, setupPlayers);

loadMapFromURL();
setupPlayers();
