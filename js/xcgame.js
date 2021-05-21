'use strict';

var gamepadManager = new Gamepad();
gamepadManager.init();

var playerCount = getPlayerCount();
var mapData = mapDataFromURL(getURLData());

var tiles = [];
var backgroundCanvasContext = document.getElementById('background').getContext('2d');
var world;
var players = [];
var totalPlayers = 0;
let enabledWeapons = [];
let enabledModifiers = [];
for (const [o, v] of getOptions().entries()) {
  if (v) {
    switch (o) {
      case 'multishot': enabledWeapons.push(2); break;
      case 'grenade': enabledWeapons.push(3); break;
      case 'missile': enabledWeapons.push(4); break;
      case 'laser': enabledWeapons.push(5); break;
      case 'sideshot': enabledModifiers.push(2); break;
      case 'deflect': enabledModifiers.push(3); break;
      case 'charge': enabledModifiers.push(4); break;
      case 'disarm': enabledModifiers.push(5); break;
    }
  }
}

var viewSize = [80, 60];
var centerX = 39.5, centerY = 29.5;
function rotateStartPosition(pies) {
  var x = -30, y = 0;
  var theta = pies * Math.PI;
  return [x * Math.cos(theta) - y * Math.sin(theta) + centerX,
          x * Math.sin(theta) + y * Math.cos(theta) + centerY,
          theta];
}
var startPositions = {
  '2': [rotateStartPosition(0), rotateStartPosition(1)],
  '3': [rotateStartPosition(1/6), rotateStartPosition(5/6),
        rotateStartPosition(9/6)],
  '4': [rotateStartPosition(0.25), rotateStartPosition(1.25),
        rotateStartPosition(1.75), rotateStartPosition(0.75)],
};
var emptyTiles = [];

var countDown = 300;
var weaponDropInitial = 600;
var weaponDrop = 0;
var totalWeapons = 0;
var modifierDropInitial = 900;
var modifierDrop = 0;
var totalModifiers = 0;
var keyPressed = new Set();
var keyMap = getRawKeyMappings();

var health = [];
var shipDamage = [];
var landDamage = [];
var bulletsDestroyed = [];

function start() {
  for (var p = 1; p <= 4; p++) {
    health.push(document.getElementById('p' + p + 'Health'));
    shipDamage.push(document.getElementById('p' + p + 'ShipDamage'));
    landDamage.push(document.getElementById('p' + p + 'LandDamage'));
    bulletsDestroyed.push(document.getElementById('p' + p + 'BulletsDestroyed'));
  }

  world = new BIB.World('c');
  world.setViewSize(viewSize);
  world.setViewPosition([centerX, centerY]);

  var resize = function () {
    var canvas = document.getElementById('c');
    var backCanvas = document.getElementById('background');
    backCanvas.width = canvas.width;
    backCanvas.height = canvas.height;
    backCanvas.style.width = canvas.width + 'px';
    backCanvas.style.height = canvas.height + 'px';

    var canvasDiv = document.getElementById('canvasdiv');
    var horizontalSpace = canvasDiv.offsetWidth - canvas.offsetWidth;
    var verticalSpace = canvasDiv.offsetHeight - canvas.offsetHeight;
    var left = (canvasDiv.offsetLeft + 0.5 * horizontalSpace) + 'px';
    var top = (canvasDiv.offsetTop + 0.5 * verticalSpace) + 'px';
    canvas.style.left = left;
    canvas.style.top = top;
    backCanvas.style.left = left;
    backCanvas.style.top = top;
    drawBackgroundCanvas();
  };
  resize();
  window.addEventListener('resize', resize);

  var descriptors = {
    animations: [
      {
        name: 'player',
        file: 'sprites/player.png',
        size: [3, 3],
        gridDimensions: [1, 4],
      },
      {
        name: 'bullet',
        file: 'sprites/bullet.png',
        size: [0.6, 0.6],
        gridDimensions: [1, 4],
      },
      {
        name: 'explosion',
        file: 'sprites/explosion.png',
        size: [15, 15],
        gridDimensions: [1, 4],
      },
      {
        name: 'thrust',
        file: 'sprites/thrust.png',
        size: [0.75, 3],
        offset: [-1.5, 0],
      },
      {
        name: 'ground-colors',
        file: 'sprites/ground-colors.png',
        size: [1, 1],
        gridDimensions: [8, 1],
      },
      {
        name: 'numbers',
        file: 'sprites/numbers.png',
        size: [20, 10],
        gridDimensions: [1, 6],
      },
      {
        name: 'weapons',
        file: 'sprites/weapons.png',
        size: [2, 2],
        gridDimensions: [8, 1],
      },
      {
        name: 'modifiers',
        file: 'sprites/modifiers.png',
        size: [2, 2],
        gridDimensions: [6, 1],
      },
    ],

    kinds: [
      {
        name: 'player',
        animation: 'player',
        fixtures: [
          {
            shapeType: 'circle',
            shapeData: 1.2,
            properties: {
              friction: 0,
            },
            collisionFilter: {
              collisionCategories: ['player'],
            },
          },
        ],
        linearDamping: 0.2,
        angularDamping: 10,
      },
      {
        name: 'blank',
        movementType: 'static',
      },
      {
        name: 'bullet',
        animation: 'bullet',
        fixtures: [
          {
            shapeType: 'box',
            shapeData: 0.2,
            properties: {
              friction: 0,
              restitution: 1,
            },
          },
        ],
        angularDamping: 5,
      },
      {
        name: 'explosion',
        animation: 'explosion',
        movementType: 'static',
        fixtures: [
          {
            shapeType: 'circle',
            shapeData: 6.3,
            properties: {
              isSensor: true,
            },
          },
        ],
      },
      {
        name: 'deflection',
        animation: 'explosion',
        movementType: 'static',
        fixtures: [
          {
            shapeType: 'circle',
            shapeData: 6.3,
            properties: {
              isSensor: true,
            },
          },
        ],
      },
      {
        name: 'zoom',
        animation: 'numbers',
        movementType: 'static',
      },
      {
        name: 'wall',
        animation: 'ground-colors',
        movementType: 'static',
        fixtures: [
          {
            shapeType: 'box',
            shapeData: 0.5,
            collisionFilter: {
              collisionCategories: ['wall'],
            },
          },
        ],
      },
      {
        name: 'barrier',
        animation: 'ground-colors',
        movementType: 'static',
        fixtures: [
          {
            // Default shape.
            collisionFilter: {
              collisionCategories: ['wall'],
            },
          }
        ],
      },
      {
        name: 'debris',
        animation: 'ground-colors',
        movementType: 'kinematic',
      },
      {
        name: 'weapon',
        animation: 'weapons',
        movementType: 'dynamic',
        linearDamping: 0.8,
        fixedRotation: true,
        fixtures: [
          {
            shapeType: 'box',
            shapeData: 0.9,
            properties: {
              friction: 0,
              restitution: 1,
            },
            collisionFilter: {
              collisionCategories: ['weapon'],
              onlyCollidesWith: ['wall'],
            },
          },
        ],
      },
      {
        name: 'modifier',
        animation: 'modifiers',
        movementType: 'dynamic',
        linearDamping: 0.8,
        fixedRotation: true,
        fixtures: [
          {
            shapeType: 'box',
            shapeData: 0.9,
            properties: {
              friction: 0,
              restitution: 1,
            },
            collisionFilter: {
              collisionCategories: ['modifier'],
              onlyCollidesWith: ['wall'],
            },
          },
        ],
      },
      {
        name: 'disarmAnimation',
        animation: 'modifiers',
        movementType: 'kinematic',
        fixedRotation: true,
        fixtures: [
          {
            shapeType: 'box',
            shapeData: 0.5,
            properties: {
              isSensor: true,
            },
            collisionFilter: {
              collisionCategories: ['disarmAnimation'],
              onlyCollidesWith: ['player'],
            },
          },
        ],
      },
    ],
  };

  world.load(descriptors, onLoadComplete);
}

function onLoadComplete() {
  world.start();
  setup();
}

function setup() {
  world.playerCollisionMask = 1 << world.getOrAddCollisionCategory('player');

  world.allKinds['bullet'].beginContactActions['player'] = hitPlayer;
  world.allKinds['bullet'].beginContactActions['wall'] = hitWall;
  world.allKinds['bullet'].beginContactActions['barrier'] = hitBarrier;
  world.allKinds['explosion'].beginContactActions['player'] = explosionPlayer;
  world.allKinds['explosion'].beginContactActions['bullet'] = explosionBullet;
  world.allKinds['player'].beginContactActions['weapon'] = collectWeapon;
  world.allKinds['player'].beginContactActions['modifier'] = collectModifier;
  world.allKinds['deflection'].beginContactActions['bullet'] = deflectionBullet;
  world.allKinds['disarmAnimation'].beginContactActions['player'] = disarmAnimationPlayer;

  // Create initial Things.
  world.newThing('barrier', { position: [40, -1], scale: [82, 1] });
  world.newThing('barrier', { position: [40, 60], scale: [82, 1] });
  world.newThing('barrier', { position: [-1, 30], scale: [1, 62] });
  world.newThing('barrier', { position: [80, 30], scale: [1, 62] });

  drawBackgroundCanvas();
  tiles = new Array(mapData.length);
  for (var x = 0; x < 80; x++) {
    for (var y = 0; y < 60; y++) {
      makeWallIfNecessary(x, y);
      if (mapData[x + y * 80] === 0)
        emptyTiles.push([x, y]);
    }
  }

  startPositions[playerCount].forEach(function (p, i) { makePlayer(p, i); });

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  world.onEnterFrameActions = duringGame;
}

function drawBackgroundCanvas() {
  var canvas = document.getElementById('c');
  backgroundCanvasContext.clearRect(0, 0, canvas.width, canvas.height);
  for (var x = 0; x < 80; x++) {
    for (var y = 0; y < 60; y++) {
      drawBackgroundCanvasAt(x, y);
    }
  }
}

function drawBackgroundCanvasAt(x, y) {
  var color = mapData[x + y * 80];
  var backCanvas = document.getElementById('background');
  var size = backCanvas.width / 80;
  backgroundCanvasContext.clearRect(
      (size * x) | 0, (size * y) | 0, (size + 1) | 0, (size + 1) | 0);
  if (color !== 0) {
    backgroundCanvasContext.fillStyle = colorFillStyleHalf[color];
    backgroundCanvasContext.fillRect(
        (size * x) | 0, (size * y) | 0, (size + 1) | 0, (size + 1) | 0);
  }
}

function makeWallIfNecessary(x, y) {
  var tileColor = mapData[x + y * 80];
  if (tileColor === 0)
    return;

  var existingTile = tiles[x + y * 80];
  var isExposed =
      mapData[x-1 + (y-1) * 80] === 0 || mapData[x+1 + (y+1) * 80] === 0 ||
      mapData[x-1 + y * 80] === 0     || mapData[x+1 + y * 80] === 0 ||
      mapData[x + (y-1) * 80] === 0   || mapData[x + (y+1) * 80] === 0 ||
      mapData[x-1 + (y+1) * 80] === 0 || mapData[x+1 + (y-1) * 80] === 0;

  if (isExposed && !existingTile) {
    // Create a real wall.
    var tile = world.newThing('wall', { position: [x, y] });
    tile.actor.setFrame(tileColor);
    tiles[x + y * 80] = tile;
  }
}

function makePlayer(startPosition, index) {
  var player = world.newThing('player', {
    position: nearestEmptyTile([startPosition[0], startPosition[1]]),
    angle: startPosition[2],
  });
  setOwner(player, index);
  player.thrust = world.newThing('blank', { animation: 'thrust' });
  player.shootTime = 30;
  player.weapon = 0;
  player.modifier = 0;
  player.modifierTime = 0;
  player.modifierIcon = null;
  player.chargeUp = 0;
  player.chargeDown = 0;
  player.debrisTime = 0;
  player.dyingTime = 0;
  player.laserHit1 = {
    target: new box2d.b2Vec2(),
    bulletTarget: null,
    deflectionTarget: null,
    normal: null,
  };
  player.laserHit2 = {
    target: new box2d.b2Vec2(),
    bulletTarget: null,
    deflectionTarget: null,
    normal: null,
  };
  player.laser = world.newThing(
      'blank', { animation: 'bullet', scale: [0.5, 0.5], depth: 1 });
  player.laser.actor.alpha = 0;
  player.laser.actor.setFrame(index);
  players.push(player);
  showCounter(index, 'Health', true);
  totalPlayers++;
}

function nearestEmptyTile(position) {
  var index = emptyTiles.map(function (tile) {
    var dx = position[0] - tile[0];
    var dy = position[1] - tile[1];
    return dx * dx + dy * dy;
  }).reduce(indexOfMinimum, 0);
  return emptyTiles[index];
}

////////////////////////////////////////////////////////////////////////////////
// Contact actions

function hitPlayer(bullet, player) {
  if (bullet.destroyed)
    return;

  if (player.modifier == 3) {
    deflectionBullet(player.modifierIcon, bullet);
    return;
  }

  var bulletVelocity = bullet.body.GetLinearVelocity();
  var bulletPosition = bullet.body.GetPosition();
  var bulletIndex = bullet.actor.getFrame();
  if (destroyBullet(bullet))
    damagePlayer(player, bulletVelocity, bulletPosition, bulletIndex);
}

function damagePlayer(player, bulletVelocity, bulletPosition, bulletIndex) {
  var velocity = player.body.GetLinearVelocity().Clone();
  bulletVelocity.SelfMul(0.2);
  velocity.SelfAdd(bulletVelocity);
  makeDebris(0.5, bulletPosition, velocity, 1, 5);
  shipDamage[bulletIndex].textContent++;
  var playerHealth = health[player.actor.getFrame()].textContent--;
  if (playerHealth < 10)
    extraPlayerDebris(player);
}

function extraPlayerDebris(player, altSpread) {
  var spread = altSpread || 1;
  var position = player.body.GetPosition().Clone();
  position.x += -spread + 2 * spread * Math.random();
  position.y += -spread + 2 * spread * Math.random();
  makeDebris(0.5, position, player.body.GetLinearVelocity(), 1, 10);
}

function hitWall(bullet, wall) {
  if (bullet.destroyed)
    return;

  landDamage[bullet.actor.getFrame()].textContent++;
  destroyWall(wall, bullet.body.GetPosition());
  destroyBullet(bullet);
}

function destroyWall(wall, bulletPosition) {
  if (wall.destroyed)
    return;

  var wallPosition = wall.body.GetPosition();
  var color = wall.actor.getFrame();
  wall.destroy();

  var velocity = wallPosition.Clone();
  velocity.SelfSub(bulletPosition);
  makeDebris(0.5, wallPosition, velocity, color, 2);
  var x = wallPosition.x | 0;
  var y = wallPosition.y | 0;
  mapData[x + y * 80] = 0;
  for (var i = x - 1; i <= x + 1; i++) {
    for (var j = y - 1; j <= y + 1; j++) {
      makeWallIfNecessary(i, j);
    }
  }
  drawBackgroundCanvasAt(x, y);
  emptyTiles.push([x, y]);
}

function hitBarrier(bullet, barrier) {
  if (!bullet.destroyed)
    destroyBullet(bullet);
}

function explosionPlayer(explosion, player) {
  var playerBody = player.body;
  var delta = playerBody.GetPosition().Clone();
  delta.SelfSub(explosion.body.GetPosition());
  delta.SelfNormalize();
  delta.SelfMul(60);
  damagePlayer(
      player, delta, playerBody.GetPosition(), explosion.actor.getFrame());
  delta.SelfMul(40 * playerBody.m_mass)
  playerBody.ApplyForceToCenter(delta);
}

function explosionBullet(explosion, bullet) {
  if (bullet.destroyed) return;

  var bulletPosition = bullet.body.GetPosition();
  // Debris moves away from epicenter, depending on distance.
  var velocity = bulletPosition.Clone();
  velocity.SelfSub(explosion.body.GetPosition());
  const explosionRadiusSquared = 6.3 * 6.3;
  velocity.SelfMul(4 * (explosionRadiusSquared - velocity.GetLengthSquared()) / explosionRadiusSquared);
  makeDebris(0.6, bulletPosition, velocity, bullet.actor.getFrame(), 5, 'bullet');
  destroyBullet(bullet);
  bulletsDestroyed[explosion.actor.getFrame()].textContent++;
}

function destroyBullet(bullet) {
  // Explode grenades.
  var actor = bullet.actor;
  if (actor.scaleX == 2 && actor.scaleY == 2) {
    var explosion = world.newThing(
        'explosion', { position: bullet.body.GetPosition(), depth: 1 });
    setOwner(explosion, actor.getFrame());
    bullet.destroy()
    return false;
  }
  bullet.destroy();
  return true;
}

function makeDebris(size, position, velocity, color, spread, altAnimation) {
  var animation = altAnimation || 'ground-colors';
  for (var x = -1; x < 2; x += 2) {
    for (var y = -1; y < 2; y += 2) {
      var t = world.newThing('debris', {
        position: [position.x + x * 0.5 * size * Math.random(),
                   position.y + y * 0.5 * size * Math.random()],
        scale: [size, size],
        velocity: [velocity.x + x * spread * size * Math.random(),
                   velocity.y + y * spread * size * Math.random()],
        animation: animation,
      });
      t.actor.setFrame(color);
    }
  }
}

function collectWeapon(player, weapon) {
  if (weapon.destroyed)
    return;

  if (weapon.actor.getFrame() > 1) {
    var weaponIndex = weapon.actor.getFrame();
    player.weapon = weaponIndex;
    destroyWeapon(weapon);
  }
}

function destroyWeapon(weapon) {
  if (weapon.destroyed)
    return;

  let explosion = world.newThing('zoom', {
    position: weapon.body.GetPosition(),
    animation: 'weapons',
    depth: 1,
    alpha: 0.5,
  });
  explosion.actor.setFrame(weapon.actor.getFrame());
  weapon.destroy();
  totalWeapons--;
}

function collectModifier(player, modifier) {
  if (modifier.destroyed)
    return;

  const modifierIndex = modifier.actor.getFrame();
  if (modifierIndex > 1 && player.modifier == 0) {
    const modifierPosition = modifier.body.GetPosition();
    let explosion = world.newThing('zoom', {
      position: modifierPosition,
      animation: 'modifiers',
      depth: 1,
      alpha: 0.5,
    });
    explosion.actor.setFrame(modifierIndex);
    modifier.destroy();
    totalModifiers--;

    if (modifierIndex == 5) {
      world.allKinds['weapon'].forEachThing(function (thing) {
        destroyWeapon(thing);
      });
      world.allKinds['player'].forEachThing(function (targetPlayer) {
        if (targetPlayer == player) return;

        let disarmAnimation = world.newThing('disarmAnimation', { alpha: 0, position: modifierPosition });
        disarmAnimation.actor.setFrame(5);
        disarmAnimation.player = targetPlayer;
      });
    } else {
      player.modifier = modifierIndex;
      player.modifierTime = 900;
    }

    if (!player.modifierIcon) {
      if (modifierIndex == 3) {
        player.modifierIcon = world.newThing(
          'deflection', { alpha: 0.5, scale: [0.45, 0.45], depth: 1, position: player.body.GetPosition(), angle: player.body.GetAngleRadians() });
        setOwner(player.modifierIcon, player.index);
      } else if (modifierIndex == 4) {
        player.modifierIcon = world.newThing(
          'blank', { animation: 'explosion', scale: [0.1, 0.1], depth: 1, position: player.body.GetPosition() });
        player.modifierIcon.actor.setFrame(player.index);
      }
      drawModifiers(player);
    }
  }
}

function deflectionBullet(deflection, bullet) {
  if (!deflection || deflection.destroyed || !bullet || bullet.destroyed || bullet.actor.getFrame() == deflection.actor.getFrame())
    return;

  if (bullet.actor.scaleX == 2) {
    destroyBullet(bullet);
    return;
  }
  setOwner(bullet, deflection.actor.getFrame());
  if (bullet.actor.scaleX == 1) {
    let normal = bullet.body.GetPosition().Clone();
    normal.SelfSub(deflection.body.GetPosition());
    normal.SelfNormalize();
    let impulse = -2 * bullet.body.m_mass * bullet.body.GetLinearVelocity().Dot(normal);
    normal.SelfMul(impulse);
    bullet.body.ApplyLinearImpulse(normal, bullet.body.GetPosition());
  }
}

function disarmAnimationPlayer(disarmAnimation, player) {
  if (player != disarmAnimation.player) return;

  let velocity = disarmAnimation.body.GetLinearVelocity().Clone();
  velocity.SelfNormalize();
  velocity.SelfMul(10);
  if (player.weapon != 1) {
    var thing = world.newThing('weapon', {
      position: player.body.GetPosition(),
      velocity: velocity,
      depth: 1,
    });
    thing.actor.setFrame(player.weapon);
    totalWeapons++;
    player.weapon = 1;
  }
  makeDebris(0.6, disarmAnimation.body.GetPosition(), new box2d.b2Vec2(), 0, 10, 'modifiers');
  disarmAnimation.destroy();
}

////////////////////////////////////////////////////////////////////////////////
// Loop

function duringGame() {
  countDownToStart();
  if (countDown < 0) {
    dropWeapons();
    dropModifiers();
    aimMissiles();
    aimDisarmAnimations();
    players.forEach(function (player, index) {
      if (player.destroyed)
        return;

      trail(player, index);
      thrust(player, index);
      rotate(player, index);
      drawModifiers(player, index);
      aimLaser(player, index);
      shoot(player, index);
      checkHealth(player, index);
    });
    fade('debris');
    fade('explosion');
  }
  fade('zoom');
  zoom('zoom');
}

function countDownToStart() {
  if (countDown < 0)
    return;

  if (countDown % 60 == 0) {
    var number = world.newThing('zoom', { position: [40.5, 30.5] });
    number.actor.setFrame((countDown / 60 | 0));
  }
  if (countDown == 0) {
    players.forEach(function (player) {
      player.weapon = 1;
    });
  }
  countDown--;
}

function dropWeapons() {
  if (weaponDropInitial > 0) {
    weaponDropInitial--;
  } else if (totalWeapons == 0 || weaponDrop >= 600 && totalWeapons < totalPlayers) {
    weaponDrop = 0;
    spawn('weapon', randomDirection());
    totalWeapons++;
  }
  weaponDrop++;
  world.allKinds['weapon'].forEachThing(spawnAnimation);
}

function dropModifiers() {
  if (modifierDropInitial > 0) {
    modifierDropInitial--;
  } else if (totalModifiers == 0 || modifierDrop >= 600 && totalModifiers < totalPlayers) {
    modifierDrop = 0;
    spawn('modifier', randomDirection());
    totalModifiers++;
  }
  modifierDrop++;
  world.allKinds['modifier'].forEachThing(spawnAnimation);
}

function randomDirection() {
  const angle = 2 * Math.PI * Math.random();
  return new box2d.b2Vec2(10 * Math.cos(angle), 10 * Math.sin(angle));
}

function spawn(name, velocity) {
  var emptyTile = emptyTiles[(emptyTiles.length * Math.random()) | 0];
  var thing = world.newThing(name, {
    position: [emptyTile[0], emptyTile[1]],
    velocity: velocity,
    depth: 1,
  });
  thing.actor.alpha = 0.03;
}

function spawnAnimation(thing) {
  if (thing.actor.getFrame() != 0) {
    // Let disarmed weapons collide with players once they slow down.
    const collidesWithPlayer = thing.body.m_fixtureList.m_filter.maskBits & world.playerCollisionMask;
    if (!collidesWithPlayer && thing.body.GetLinearVelocity().GetLengthSquared() < 1) {
      thing.body.m_fixtureList.m_filter.maskBits |= world.playerCollisionMask;
    }
    return;
  }

  var angle = thing.body.GetAngleRadians();
  if (angle < 10 * Math.PI) {
    thing.body.SetAngleRadians(angle + 0.03 * Math.PI);
    thing.actor.alpha += 0.01;
  } else {
    thing.actor.alpha = 1;
    thing.body.SetAngleRadians(10 * Math.PI);
    if (thing.kind.name == 'modifier') {
      thing.actor.setFrame(enabledModifiers[enabledModifiers.length * Math.random() | 0]);
    } else {
      thing.actor.setFrame(enabledWeapons[enabledWeapons.length * Math.random() | 0]);
    }
    // It can now collide with players.
    thing.body.m_fixtureList.m_filter.maskBits |= world.playerCollisionMask;
  }
}

function aimMissiles() {
  world.allKinds['bullet'].forEachThing(function (thing) {
    var actor = thing.actor;
    if (actor.scaleX != 3)
      return;

    var body = thing.body;
    var position = body.GetPosition();
    var closest = getClosestPlayer(position, actor.getFrame());
    if (closest != thing.actor.getFrame()) {
      aimToward(body, players[closest]);
      changeVelocityToMatchAngle(body);
    }
  });
}

function getClosestPlayer(position, ignoreIndex) {
  return players.map(function (player, playerIndex) {
    if (ignoreIndex == playerIndex)
      return 1000000;

    if (player.destroyed) {
      return 1000001;
    }

    var playerPosition = player.body.GetPosition();
    var dx = playerPosition.x - position.x;
    var dy = playerPosition.y - position.y;
    return dx * dx + dy * dy;
  }).reduce(indexOfMinimum, ignoreIndex);
}

function aimToward(body, player) {
  var PIx2 = 2 * Math.PI;
  var delta = player.body.GetPosition();
  delta.SelfSub(body.GetPosition());
  var target = Math.atan2(delta.y, delta.x);
  var current = body.GetAngleRadians();
  var angleDelta = (target - current) % PIx2;
  if (angleDelta > Math.PI) {
    angleDelta -= PIx2;
  } else if (angleDelta < -Math.PI) {
    angleDelta += PIx2;
  }
  var torque = angleDelta < -0.5 ? -0.5 : angleDelta > 0.5 ? 0.5 : angleDelta;
  body.ApplyTorque(3 * torque * body.m_mass);
}

function changeVelocityToMatchAngle(body) {
  var velocity = body.GetLinearVelocity();
  var speed = velocity.GetLength();
  // Get the velocity required.
  var angle = body.GetAngleRadians();
  var delta = new box2d.b2Vec2(Math.cos(angle), Math.sin(angle));
  delta.SelfMul(speed);
  // Get the change in velocity required.
  delta.SelfSub(velocity);
  // Get the force required for this time step (1/60 s), and the mass of the
  // bullet.
  delta.SelfMul(60);
  delta.SelfMul(body.m_mass);
  body.ApplyForceToCenter(delta);
}

function aimDisarmAnimations() {
  world.allKinds['disarmAnimation'].forEachThing(function (thing) {
    let delta = thing.player.body.GetPosition();
    delta.SelfSub(thing.body.GetPosition());
    // Make it fade and zoom in as it gets close to player.
    thing.actor.alpha = 0.8 - delta.GetLength() / 20;
    const scale = 1 + delta.GetLength() / 5;
    thing.actor.scaleX = scale;
    thing.actor.scaleY = scale;
    delta.SelfNormalize();
    delta.SelfMul(30);
    thing.body.SetLinearVelocity(delta);
  });
}

function trail(player, index) {
  var position = player.body.GetPosition().Clone();
  var angle = player.body.GetAngleRadians();
  position.x -= Math.cos(angle);
  position.y -= Math.sin(angle);
  var t = world.newThing('debris', {
    position: position,
    scale: [0.5, 0.5],
    animation: 'bullet',
    depth: 2,
  });
  t.actor.setFrame(index);
}

function thrust(player, index) {
  var gamepad = gamepadManager.gamepads[playerCount - index - 1];
  var pressed = keyPressed.has(keyMap[index].forward) ||
                (gamepad && gamepad.buttons[3].pressed);
  if (!pressed) {
    player.thrust.actor.alpha = 0;
    return;
  }

  // Get the direction we want to go.
  var body = player.body;
  var angle = body.GetAngleRadians();
  var direction = new box2d.b2Vec2(Math.cos(angle), Math.sin(angle));
  direction.SelfMul(50 * body.m_mass);
  body.ApplyForceToCenter(direction);

  var thrust = player.thrust;
  thrust.body.SetTransform(body.GetTransform());
  thrust.actor.alpha = 1;
}

function rotate(player, index) {
  var delta = +keyPressed.has(keyMap[index].right) - +keyPressed.has(keyMap[index].left);
  var gamepad = gamepadManager.gamepads[playerCount - index - 1];
  if (gamepad) {
    delta += gamepad.buttons[1].value - gamepad.buttons[2].value;
  }
  if (delta !== 0) {
    player.body.ApplyTorque(2000 * delta);
  }
}

function drawModifiers(player, index) {
  let icon = player.modifierIcon;
  if (!icon || icon.destroyed) return;
  let pp = player.body.GetPosition();
  icon.body.SetPosition(pp);
  if (player.modifier == 4) {
    let angle = player.body.GetAngleRadians();
    var direction = new box2d.b2Vec2(Math.cos(angle), Math.sin(angle));
    direction.SelfMul(1.6 + 0.2 * player.chargeUp);
    direction.SelfAdd(pp);
    icon.body.SetPosition(direction);
    let scale = (player.chargeUp + 1) / 30;
    icon.actor.scaleX = scale;
    icon.actor.scaleY = scale;
    icon.actor.alpha = player.chargeDown > 0 ? 0 : 1;
  }
}

function aimLaser(player, index) {
  let actor = player.laser.actor;
  let body = player.laser.body;
  if (player.weapon != 5 || (player.modifier == 4 && player.chargeDown <= 0)) {
    actor.alpha = 0;
    return;
  }

  actor.scaleY = player.modifier == 4 ? 1.5 : 0.5;
  actor.alpha = 1;
  const position = player.body.GetPosition();
  const angle = player.body.GetAngleRadians();

  if (player.modifier == 2) {
    raycastLaser(index, position, angle + Math.PI / 2, player.laserHit1);
    raycastLaser(index, position, angle - Math.PI / 2, player.laserHit2);
    actor.scaleX = 170 * (player.laserHit1.fraction + player.laserHit2.fraction);
    body.SetPositionXY(0.5 * (player.laserHit1.target.x + player.laserHit2.target.x),
                       0.5 * (player.laserHit1.target.y + player.laserHit2.target.y));
    body.SetAngleRadians(angle + Math.PI / 2);
  } else {
    raycastLaser(index, position, angle, player.laserHit1);
    actor.scaleX = 170 * player.laserHit1.fraction;
    body.SetPositionXY(0.5 * (position.x + player.laserHit1.target.x),
                       0.5 * (position.y + player.laserHit1.target.y));
    body.SetAngleRadians(angle);
  }
}

function raycastLaser(index, position, angle, output) {
  const deflection = world.allKinds['deflection'];
  const wall = world.allKinds['wall'];
  const barrier = world.allKinds['barrier'];
  const playerKind = world.allKinds['player'];
  const bulletKind = world.allKinds['bullet'];
  let target = position.Clone();
  target.x += 100 * Math.cos(angle);
  target.y += 100 * Math.sin(angle);
  world.boxWorld.RayCast(function (fixture, point, normal, fraction) {
    const thing = fixture.GetBody().GetUserData();
    const kind = thing.kind;
    if (kind === playerKind || (kind === bulletKind && thing.actor.getFrame() != index) ||
      kind === deflection || kind === wall || kind === barrier) {
      output.target.Copy(point);
      output.bulletTarget = kind === bulletKind ? thing : null;
      output.deflectionTarget = kind === deflection ? thing : null;
      output.normal = normal;
      output.fraction = fraction;
      return fraction;  // Only look for fixtures closer than this one.
    } else {
      return -1;  // Ignore this fixture and continue.
    }
  }, position, target);
}

function shoot(player, index) {
  var weapon = weapons[player.weapon];
  player.shootTime--;
  if (player.shootTime <= 0) {
    weapon.shoot(player, index);
  }
  if (player.modifier > 0) {
    if (player.modifierTime > 0) {
      player.modifierTime--;
    } else {
      clearModifier(player);
    }
  }
}

function clearModifier(player) {
  player.modifier = 0;
  player.chargeDown = player.chargeUp;
  player.chargeUp = 0;
  let icon = player.modifierIcon;
  if (icon) {
    if (!icon.destroyed) icon.destroy();
    player.modifierIcon = null;
  }
}

function checkHealth(player, index) {
  var healthCounter = health[index];
  if (healthCounter.textContent >= 10)
    return;

  player.debrisTime++;
  if (healthCounter.textContent > 0 && player.debrisTime >= 30) {
    player.debrisTime = 0;
    extraPlayerDebris(player);
  }

  if (healthCounter.textContent <= 0) {
    player.dyingTime++;
    player.weapon = 0;
    if (player.debrisTime >= 5) {
      player.debrisTime = 0;
      extraPlayerDebris(player);
    }
  }

  if (player.dyingTime >= 300)
    destroyPlayer(player, index)
}

function destroyPlayer(player, index) {
  for (var i = 0; i < 10; i++)
    extraPlayerDebris(player, 10);

  var explosion = world.newThing('zoom', {
    position: player.body.GetPosition(),
    animation: 'explosion',
    depth: 1,
  });
  explosion.actor.setFrame(index);

  player.laser.destroy();
  player.thrust.destroy();
  player.destroy();

  showCounter(index, 'Health', false);
  showCounter(index, 'Stats', true);
  totalPlayers--;

  if (totalPlayers <= 1) {
    players.forEach(function (player, index) {
      showCounter(index, 'Stats', true);
    });
  }
}

function fade(kind) {
  world.allKinds[kind].forEachThing(function (thing) {
    thing.actor.alpha -= 0.05;
    if (thing.actor.alpha <= 0)
      thing.destroy();
  });
}

function zoom(kind) {
  world.allKinds[kind].forEachThing(function (thing) {
    thing.actor.scaleX += 0.5;
    thing.actor.scaleY += 0.5;
  });
}

////////////////////////////////////////////////////////////////////////////////
// Weapons

var weapons = [
  {  // None
    shoot: function (player) {
      player.shootTime = 1000;
    },
  },
  {  // Gun
    shoot: function (player, index) {
      player.shootTime = 30;
      // If charging, charge up instead of shooting.
      // Once charged, shoot 3 times in quick succession.
      if (player.modifier == 4 && player.chargeUp < 3 && player.chargeDown <= 0) {
        player.chargeUp++;
        if (player.chargeUp >= 3) {
          player.chargeUp = 0;
          player.chargeDown = 5;
        }
        else return;
      }
      weaponShoot(player, index, 0, [1, 1], 30);
      if (player.chargeDown > 0) {
        player.chargeDown--;
        if (player.chargeDown > 0) player.shootTime = 5;
      }
    },
  },
  {  // Multi-shot
    shoot: function (player, index) {
      player.shootTime = 60;
      let arc = 1;
      // Once charged, shoot a wider arc followed by a regular.
      if (player.modifier == 4 && player.chargeUp < 3 && player.chargeDown <= 0) {
        player.chargeUp++;
        player.shootTime = 45;
        if (player.chargeUp >= 3) {
          player.chargeUp = 0;
          player.chargeDown = 3;
        }
        else return;
      }
      if (player.chargeDown > 0) {
        player.chargeDown--;
        arc = player.chargeDown;
        if (player.chargeDown > 0) player.shootTime = 5;
      }
      for (var i = -arc; i <= arc; i += 1) {
        weaponShoot(player, index, 0.1 * i, [1, 1]);
      }
    },
  },
  {  // Grenade
    shoot: function (player, index) {
      player.shootTime = 60;
      let arc = 0;
      // Once charged, shoot 5 simutaneously.
      if (player.modifier == 4 && player.chargeUp < 3 && player.chargeDown <= 0) {
        player.chargeUp++;
        if (player.chargeUp >= 3) {
          player.chargeUp = 0;
          player.chargeDown = 3;
        }
        else return;
      }
      if (player.chargeDown > 0) {
        arc = player.chargeDown - 1;
        player.chargeDown = 0;
      }
      for (var i = -arc; i <= arc; i += 1) {
        weaponShoot(player, index, 0.1 * i, [2, 2]);
      }
    },
  },
  {  // Missile
    shoot: function (player, index) {
      player.shootTime = 60;
      // Once charged, shoot 5 times in quick succession.
      if (player.modifier == 4 && player.chargeUp < 3 && player.chargeDown <= 0) {
        player.chargeUp++;
        if (player.chargeUp >= 3) {
          player.chargeUp = 0;
          player.chargeDown = 5;
        }
        else return;
      }
      weaponShoot(player, index, 0, [3, 1]);
      if (player.chargeDown > 0) {
        player.chargeDown--;
        if (player.chargeDown > 0) player.shootTime = 10;
      }
    },
  },
  {  // Laser
    shoot: function (player, index) {
      player.shootTime = 15;
      // Charge for 120, then shoot for 80 at 3x rate.
      if (player.modifier == 4 && player.chargeUp < 2 && player.chargeDown <= 0) {
        player.chargeUp += 0.25;
        if (player.chargeUp >= 2) {
          player.chargeUp = 0;
          player.chargeDown = 16;
        }
        else return;
      }

      const charged = player.chargeDown > 0;
      if (player.modifier == 2) {
        shootLaser(player, Math.PI / 2, player.laserHit1, charged);
        shootLaser(player, -Math.PI / 2, player.laserHit2, charged);
      } else {
        shootLaser(player, 0, player.laserHit1, charged);
      }

      if (player.chargeDown > 0) {
        player.chargeDown--;
        if (player.chargeDown > 0) player.shootTime = 4;
      }
    },
  },
];

function weaponShoot(player, index, angleDelta, scale, speed) {
  const position = player.body.GetPosition();
  const angle = player.body.GetAngleRadians() + angleDelta;
  const velocity = player.body.GetLinearVelocity();
  speed = speed || 20;
  if (player.modifier == 2) {
    bulletShoot(position, angle + Math.PI / 2, velocity, speed, index, scale);
    bulletShoot(position, angle - Math.PI / 2, velocity, speed, index, scale);
  } else {
    bulletShoot(position, angle, velocity, speed, index, scale);
  }
}

function bulletShoot(position, angle, baseVelocity, speed, index, scale) {
  let velocity = baseVelocity.Clone();
  velocity.x += speed * Math.cos(angle);
  velocity.y += speed * Math.sin(angle);
  makeBullet(position, angle, velocity, index, scale);
}

function shootLaser(player, angleDelta, hit, charged) {
  const angle = player.body.GetAngleRadians() + angleDelta;
  const bullet = hit.bulletTarget;
  const deflection = hit.deflectionTarget;
  if (bullet && !bullet.destroyed) {
    var body = bullet.body;
    makeDebris(0.6, body.GetPosition(), body.GetLinearVelocity(),
      bullet.actor.getFrame(), 5, 'bullet');
    destroyBullet(bullet);
    bulletsDestroyed[player.index].textContent++;
  } else if (deflection && !charged) {
    const deflectionIndex = deflection.actor.getFrame();
    let deflectedAngle = Math.PI + Math.atan2(hit.normal.y, hit.normal.x);
    deflectedAngle = 2 * deflectedAngle - angle;
    const deflectedAngleDelta = Math.PI + 0.4 * Math.random() - 0.2;
    laserShoot(players[deflectionIndex], deflectionIndex, deflectedAngle + deflectedAngleDelta, hit.target);
  } else if (deflection && charged) {
    var explosion = world.newThing('zoom', {
      position: deflection.body.GetPosition(),
      animation: 'explosion',
      depth: 1,
      alpha: 0.5,
    });
    let deflectionIndex = deflection.actor.getFrame();
    explosion.actor.setFrame(deflectionIndex);
    clearModifier(players[deflectionIndex]);
  } else {
    laserShoot(player, player.index, angle, hit.target);
    if (charged) {
      makeDebris(0.6, hit.target, new box2d.b2Vec2(), 1, 10);
    }
  }
}

function laserShoot(relativeTo, index, angle, position) {
  let velocity = relativeTo.body.GetLinearVelocity().Clone();
  let speed = 20;
  velocity.x += speed * Math.cos(angle);
  velocity.y += speed * Math.sin(angle);
  makeBullet(position, angle, velocity, index, [1, 1]);
}

function makeBullet(position, angle, velocity, playerIndex, scale) {
  var bullet = world.newThing( 'bullet', {
      position: position, angle: angle, velocity: velocity, scale: scale });
  setOwner(bullet, playerIndex);
}

////////////////////////////////////////////////////////////////////////////////
// Utilities

function setOwner(thing, index) {
  // Give it the player's color.
  thing.actor.setFrame(index);
  // Set the groupIndex in players and their corresponding bullets.
  setGroupIndex(thing.body.GetFixtureList(), getGroupIndex(index));
}

function getGroupIndex(index) {
  // The negative index prevents them from colliding.
  return -index - 1;
}

function setGroupIndex(fixture, groupIndex) {
  var filter = fixture.GetFilterData();
  filter.groupIndex = groupIndex;
  fixture.SetFilterData(filter);
}

function showCounter(index, type, show) {
  var healthDiv = document.getElementById('p' + (index + 1) + type + 'Div');
  healthDiv.style.display = show ? 'block' : 'none';
}

function indexOfMinimum(bestIndexSoFar, currentValue, currentIndex, array) {
  return currentValue < array[bestIndexSoFar] ? currentIndex : bestIndexSoFar;
}

function keyDown(event) {
  keyPressed.add(event.code);
};

function keyUp(event) {
  keyPressed.delete(event.code);
};

window.addEventListener('load', start);

