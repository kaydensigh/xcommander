'use strict';

function openMap() {
  document.getElementById('importMapInput').click();
}

function openPng() {
  document.getElementById('importPngInput').click();
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

function renderMap(fileData) {
  var parts = fileData.split('\r\n');
  title.value = parts[0];
  author.value = parts[1];
  var data = parts[2];
  if (data.length != 4800) {
    console.log('Wrong data length: ' + data.length);
    return;
  }

  for (var x = 0; x < 80; x++) {
    for (var y = 0; y < 60; y++) {
      context.fillStyle = getFillStyle(data[x + y * 80]);
      context.fillRect(x, y, 1, 1);
    }
  }
}

function getFillStyle(value) {
  var color = colors[value];
  return 'rgb(' +
         color[0] + ', ' +
         color[1] + ', ' +
         color[2] + ')';
}

function renderPng(fileName, fileData) {
  console.log(fileData);
  var parts = (fileName + '  ').split('  ');
  title.value = parts[0];
  author.value = parts[1];

  var png = new Image();
  png.src = fileData;
  png.onload = function () {
    context.drawImage(png, 0, 0);
  }
}

function saveMap() {
  var a = document.getElementById('exportLink');
  a.href = URL.createObjectURL(getCanvasAsMap());
  a.download = title.value + '  ' + author.value + '.map';
  a.click()
}

function savePng() {
  var a = document.getElementById('exportLink');
  a.href = URL.createObjectURL(getCanvasAsPng());
  a.download = title.value + '  ' + author.value + '.png';
  a.click()
}

function getCanvasAsMap() {
  var output = [title.value, '\r\n', author.value, '\r\n'];
  getMapData(output);
  output.push('\r\n');
  return new Blob([output.join('')], {'type': 'text/plain'});
}

function getMapData(output) {
  for (var y = 0; y < 60; y++) {
    for (var x = 0; x < 80; x++) {
      output.push(getMapColor(context.getImageData(x, y, 1, 1).data));
    }
  }
}

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

function getCanvasAsPng() {
  var byteString = atob(canvas.toDataURL().split(',')[1]);
  var intArray = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++)
    intArray[i] = byteString.charCodeAt(i);
  return new Blob([intArray], {'type': 'image/png'});
}

function selectMap(event) {
  var img = event.toElement.children[0];

  var fileName = decodeURI(img.src).match(/.*\/([^\/]+)\.\w\w\w$/)[1];
  var parts = (fileName + '  ').split('  ');
  title.value = parts[0];
  author.value = parts[1];

  context.drawImage(img, 0, 0);
}

function selectPlayers(event) {
  try {
    playerCount = event.target.textContent.match(/^(\d)/)[1];
  } catch (e) {}
  document.getElementById('players').src = 'keyboard' + playerCount + '.png';
  [0, 1, 2, 3].forEach(function (index) {
    var gamepadIndex = playerCount - index - 1;
    var gamepadLeft = document.getElementById('player' + index + 'gamepadleft');
    var gamepadRight =
        document.getElementById('player' + index + 'gamepadright');
    if (gamepadManager.gamepads[gamepadIndex]) {
      gamepadLeft.src = 'gamepadleft' + (gamepadIndex + 1) + '.png';
      gamepadRight.src = 'gamepadright' + (index + 1) + '.png';
      gamepadLeft.style.visibility = 'visible';
      gamepadRight.style.visibility = 'visible';
    } else {
      gamepadLeft.style.visibility = 'hidden';
      gamepadRight.style.visibility = 'hidden';
    }
  });
}

function start() {
  if (!context)
    return;

  chrome.app.window.create('xcgame.html', {
    'width': 960,
    'height': 600,
  }, function (win) {
    gameWindow = win;
    gameWindow.contentWindow.addEventListener('load', function () {
      getMapData(gameWindow.contentWindow.mapData);
      gameWindow.contentWindow.playerCount =
          document.getElementById('players').src.match(/keyboard(\d)/)[1];
      gameWindow.contentWindow.gamepadManager = gamepadManager;
    });
  });
}

var colors = [
  [255, 255, 255],  // clear
  [  0,   0,   0],  // black
  [ 80, 166,  69],  // green
  [214, 116,   0],  // orange
  [199,  46,  30],  // red
  [135, 196, 207],  // blue
  [208, 206, 125],  // yellow
  [ 68,  30,  26],  // brown
];

var title = document.getElementById('title');
var author = document.getElementById('author');
var canvas = document.getElementById('c');
canvas.width = 80;
canvas.height = 60;
var context = canvas.getContext('2d');
context.fillStyle = getFillStyle(0);
context.fillRect(0, 0, 80, 60);
var gameWindow;

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
document.getElementById('start').addEventListener('click', start);

var playerCount = 2;
var gamepadManager = new Gamepad();
gamepadManager.init();

gamepadManager.bind(Gamepad.Event.CONNECTED, selectPlayers);
gamepadManager.bind(Gamepad.Event.DISCONNECTED, selectPlayers);
selectPlayers();
