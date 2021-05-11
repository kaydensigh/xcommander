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

function getPlayerCountString() {
  return url.searchParams.get('p');
}

function updatePlayerCount(p) {
  url.searchParams.set('p', p);
  window.history.replaceState({ path: url.href }, '', url.href);
}

function startGame() {
  var path = url.pathname;
  path = path.substring(0, path.lastIndexOf('/') + 1);
  url.pathname = path + 'xcgame.html';
  window.location.href = url.href;
}

var url = new URL(window.location);
