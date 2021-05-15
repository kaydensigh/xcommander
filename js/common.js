'use strict';

// Packed format for storing maps in URLs.
// Every 2 pixels (6 bits) packed into a base64 character.
function urlFromMapData(data) {
  var packed = new Array(data.length / 2);
  for (var i = 0; i < data.length; i += 2) {
    var v = (data[i] << 3) + data[i + 1];
    packed[i / 2] = base64chars[v];
  }
  return packed.join('');
}

function mapDataFromURL(urlData) {
  var data = new Array(urlData.length * 2);
  for (var i = 0; i < urlData.length; i++) {
    var c = urlData.charCodeAt(i);
    var v = base64codeToValue(c);
    data[2 * i] = v >> 3;
    data[2 * i + 1] = v & 0b111;
  }
  return data;
}

function testURLData() {
  var dExpected = [0, 1, 2, 3, 4, 5, 6, 7];
  var u = urlFromMapData(dExpected);
  if (u != 'BTl3') console.log(u);

  var d = mapDataFromURL('BTl3');
  for (var i = 0; i < d.length; i++) {
    if (d[i] != dExpected[i]) console.log(i + ' ' + d[i]);
  }
}

var base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function base64codeToValue(c) {
  if (c >= 65 && c <= 90) { // A-Z
    return c - 65;
  } else if (c >= 97 && c <= 122) { // a-z
    return c - 97 + 26;
  } else if (c >= 48 && c <= 57) { // 0-9
    return c - 48 + 2 * 26;
  } else if (c == 45) { // -
    return 62;
  } else if (c == 95) { // _
    return 63;
  }
  console.log('Codepoint ' + c + ' is not base64.');
  return 0;
}

function testBase64() {
  for (var i = 0; i < base64chars.length; i++) {
    if (base64codeToValue(base64chars.charCodeAt(i)) != i) console.log(base64chars[i]);
  }
}

function getMapData(output) {
  for (var y = 0; y < 60; y++) {
    for (var x = 0; x < 80; x++) {
      output.push(getMapColor(context.getImageData(x, y, 1, 1).data));
    }
  }
}

// Put the map in the URL fragment.
function updateMapInURL() {
  var data = [];
  getMapData(data);
  url.hash = urlFromMapData(data);
  window.history.pushState({ path: url.href }, '', url.href);
  updateTitleAuthorInURL();
}

function updateTitleAuthorInURL() {
  var t = url.searchParams.get('t');
  var a = url.searchParams.get('a');

  var changed = false;
  if (t != title.value) {
    url.searchParams.set('t', title.value);
    changed = true;
  }
  if (a != author.value) {
    url.searchParams.set('a', author.value);
    changed = true;
  }
  if (changed)
    window.history.replaceState({ path: url.href }, '', url.href);
}

function getURLData() {
  return url.hash.substring(1);
}

function loadMapFromURL() {
  title.value = url.searchParams.get('t');
  author.value = url.searchParams.get('a');
  var urlData = getURLData();
  if (!urlData) return;

  var data = mapDataFromURL(urlData);
  for (var y = 0; y < 60; y++) {
    for (var x = 0; x < 80; x++) {
      context.fillStyle = colorFillStyle[data[x + y * 80]];
      context.fillRect(x, y, 1, 1);
    }
  }
}

// The allowed colors described by the 3 bits of each pixel.
// Only clear is empty, all others are colored blocks.
var colors = [
  [255, 255, 255],  // clear
  [0, 0, 0],  // black
  [80, 166, 69],  // green
  [214, 116, 0],  // orange
  [199, 46, 30],  // red
  [135, 196, 207],  // blue
  [208, 206, 125],  // yellow
  [68, 30, 26],  // brown
];

var colorFillStyle = [
  'rgb(255, 255, 255)',  // clear
  'rgb(  0,   0,   0)',  // black
  'rgb( 80, 166,  69)',  // green
  'rgb(214, 116,   0)',  // orange
  'rgb(199,  46,  30)',  // red
  'rgb(135, 196, 207)',  // blue
  'rgb(208, 206, 125)',  // yellow
  'rgb( 68,  30,  26)',  // brown
];

function getPlayerCount() {
  let playerCountInt = parseInt(url.searchParams.get('p'));
  if (playerCountInt != 2 && playerCountInt != 3 && playerCountInt != 4) {
    playerCountInt = 2;
    setPlayerCount('2');
  }
  return playerCountInt;
}

function updatePlayerCount(p) {
  url.searchParams.set('p', p);
  window.history.replaceState({ path: url.href }, '', url.href);
}

// Default key mappings for 4 players, plus extra to use in case there are clashes.
const defaultKeyMappings = [
  'Digit2', 'Digit1', 'KeyQ',
  'ArrowUp', 'ArrowLeft', 'ArrowRight',
  'KeyF', 'KeyC', 'KeyV',
  'NumpadMultiply', 'Numpad9', 'NumpadSubtract',
  'Numpad5', 'Numpad1', 'Numpad3',
  'Home', 'Delete', 'PageDown',
  'KeyI', 'KeyJ', 'KeyL',
  'KeyW', 'KeyA', 'KeyD',
  'Equal', 'BracketLeft', 'BracketRight',
  'KeyH', 'KeyB', 'KeyN',
];

function getRawKeyMappings() {
  const keysFromURL = url.searchParams.get('k') || '';
  let keys = keysFromURL.split(' ');
  for (let i = keys.length; i < 12; i++) keys.push('');
  return [
    { forward: keys[0], left: keys[1], right: keys[2] },
    { forward: keys[3], left: keys[4], right: keys[5] },
    { forward: keys[6], left: keys[7], right: keys[8] },
    { forward: keys[9], left: keys[10], right: keys[11] },
  ];
}
function validateKeyMappings() {
  let keyMap = getRawKeyMappings();
  // Clear any inconsistent ones (clashes for same player).
  for (const [p, playerKeys] of keyMap.entries()) {
    if (playerKeys.forward == playerKeys.left || playerKeys.forward == playerKeys.right || playerKeys.left == playerKeys.right)
      keyMap[p] = null;
  }
  // For clashes between players, clear the higher player.
  let usedCodes = new Set();
  usedCodes.add(''); // Indicates unset.
  for (const [p, playerKeys] of keyMap.entries()) {
    if (!playerKeys) continue;
    if (usedCodes.has(playerKeys.forward) || usedCodes.has(playerKeys.left) || usedCodes.has(playerKeys.right)) {
      keyMap[p] = null;
    } else {
      usedCodes.add(playerKeys.forward);
      usedCodes.add(playerKeys.left);
      usedCodes.add(playerKeys.right);
    }
  }
  // For any cleared players, grab one from the defaults list.
  for (const [p, playerKeys] of keyMap.entries()) {
    if (!playerKeys) {
      for (let i = 0; i < defaultKeyMappings.length; i += 3) {
        if (!usedCodes.has(defaultKeyMappings[i]) && !usedCodes.has(defaultKeyMappings[i + 1]) && !usedCodes.has(defaultKeyMappings[i + 2])) {
          usedCodes.add(defaultKeyMappings[i]);
          usedCodes.add(defaultKeyMappings[i + 1]);
          usedCodes.add(defaultKeyMappings[i + 2]);
          keyMap[p] = { forward: defaultKeyMappings[i], left: defaultKeyMappings[i + 1], right: defaultKeyMappings[i + 2] };
          break;
        }
      }
    }
  }

  updateKeyMappings(keyMap);
  return keyMap;
}

function updateKeyMappings(keyMap) {
  let keys = [];
  for (const p of keyMap) keys.push(p.forward, p.left, p.right);
  url.searchParams.set('k', keys.join(' '));
  window.history.replaceState({ path: url.href }, '', url.href);
}

function startGame() {
  var path = url.pathname;
  path = path.substring(0, path.lastIndexOf('/') + 1);
  url.pathname = path + 'xcgame.html';
  window.location.href = url.href;
}

var url = new URL(window.location);
