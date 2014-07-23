'use strict';

// Loaded in by outer window.
var gamepadManager = null;
var playerCount = 0;
var mapData = [];

var tiles = [];
var backgroundCanvasContext =
    document.getElementById('background').getContext('2d');
var world;
var players = [];
var totalPlayers = 0;
var startPositions = {
  '2': [[20, 30, 0], [61, 30, Math.PI]],
  '3': [[28, 21, (1/6) * Math.PI], [52, 21, (5/6) * Math.PI],
        [40, 45, -0.5 * Math.PI]],
  '4': [[20, 10, 0], [61, 10, 0.5 * Math.PI],
        [20, 51, -0.5 * Math.PI], [61, 51, Math.PI]],
};
var emptyTiles = [];

var countDown = 300;
var weaponDrop = 0;
var totalWeapons = 0;
var keyPressed = new Uint8Array(256);
var thrustKeys = [50, 38, 70, 106];
var leftKeys = [49, 37, 67, 105];
var rightKeys = [81, 39, 86, 109];

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
  world.setViewSize([80, 60]);
  world.setViewPosition([39.5, 29.5]);

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
    var top = (canvasDiv.offsetTop + 0.5 * verticalSpace)+ 'px';
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
        file: 'player.png',
        size: [3, 3],
        gridDimensions: [1, 4],
      },
      {
        name: 'bullet',
        file: 'bullet.png',
        size: [0.6, 0.6],
        gridDimensions: [1, 4],
      },
      {
        name: 'explosion',
        file: 'explosion.png',
        size: [15, 15],
        gridDimensions: [1, 4],
      },
      {
        name: 'thrust',
        file: 'thrust.png',
        size: [0.75, 3],
        offset: [-1.5, 0],
      },
      {
        name: 'ground-colors',
        file: 'ground-colors.png',
        size: [1, 1],
        gridDimensions: [8, 1],
      },
      {
        name: 'numbers',
        file: 'numbers.png',
        size: [20, 10],
        gridDimensions: [1, 6],
      },
      {
        name: 'weapons',
        file: 'weapons.png',
        size: [2, 2],
        gridDimensions: [8, 1],
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
          },
        ],
      },
      {
        name: 'barrier',
        animation: 'ground-colors',
        movementType: 'static',
        fixtures: [{}],
      },
      {
        name: 'debris',
        animation: 'ground-colors',
        movementType: 'kinematic',
      },
      {
        name: 'weapon',
        animation: 'weapons',
        movementType: 'static',
        fixtures: [
          {
            shapeType: 'box',
            shapeData: 0.5,
            properties: {
              isSensor: true,
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
  world.allKinds['bullet'].beginContactActions['player'] = hitPlayer;
  world.allKinds['bullet'].beginContactActions['wall'] = hitWall;
  world.allKinds['bullet'].beginContactActions['barrier'] = hitBarrier;
  world.allKinds['explosion'].beginContactActions['player'] = explosionPlayer;
  world.allKinds['explosion'].beginContactActions['bullet'] = explosionBullet;
  world.allKinds['player'].beginContactActions['weapon'] = collectWeapon;

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
    backgroundCanvasContext.fillStyle = getFillStyle(color);
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
  player.shootTime = 0;
  player.weapon = 0;
  player.debrisTime = 0;
  player.dyingTime = 0;
  player.laserTarget = new box2d.b2Vec2();
  player.laserBulletTarget = null;
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
  if (!bullet.destroyed) {
    destroyBullet(bullet);
    bulletsDestroyed[explosion.actor.getFrame()].textContent++;
  }
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
    var explosion = world.newThing('zoom', {
      position: weapon.body.GetPosition(),
      animation: 'weapons',
      depth: 1,
      alpha: 0.5,
    });
    explosion.actor.setFrame(weaponIndex);
    weapon.destroy();
    totalWeapons--;
  }
}

////////////////////////////////////////////////////////////////////////////////
// Loop

function duringGame() {
  countDownToStart();
  if (countDown < 0) {
    dropWeapons();
    aimMissiles();
    players.forEach(function (player, index) {
      if (player.destroyed)
        return;

      trail(player, index);
      thrust(player, index);
      rotate(player, index);
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
  weaponDrop++;
  if (weaponDrop >= 600 && totalWeapons < totalPlayers) {
    weaponDrop = 0;
    var emptyTile = emptyTiles[(emptyTiles.length * Math.random()) | 0];
    var weapon = world.newThing('weapon', {
      position: [emptyTile[0], emptyTile[1]],
      depth: 1,
    });;
    weapon.actor.alpha = 0.03;
    totalWeapons++;
  }

  world.allKinds['weapon'].forEachThing(function (weapon) {
    if (weapon.actor.getFrame() != 0)
      return;

    var angle = weapon.body.GetAngleRadians();
    if (angle < 10 * Math.PI) {
      weapon.body.SetAngleRadians(angle + 0.03 * Math.PI);
      weapon.actor.alpha += 0.01;
    } else {
      weapon.actor.alpha = 1;
      weapon.body.SetAngleRadians(10 * Math.PI);
      weapon.actor.setFrame((2 + 4 * Math.random()) | 0);
    }
  });
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
  var pressed = keyPressed[thrustKeys[index]] ||
                (gamepad && gamepad.buttons[3]);
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
  var delta = keyPressed[rightKeys[index]] - keyPressed[leftKeys[index]];
  var gamepad = gamepadManager.gamepads[playerCount - index - 1];
  if (gamepad) {
    delta += gamepad.buttons[1] - gamepad.buttons[2];
  }
  if (delta !== 0) {
    player.body.ApplyTorque(2000 * delta);
  }
}

function aimLaser(player, index) {
  var actor = player.laser.actor;
  if (player.weapon != 5) {
    actor.alpha = 0;
    return;
  }

  actor.alpha = 1;
  var position = player.body.GetPosition();
  var angle = player.body.GetAngleRadians();

  var wall = world.allKinds['wall'];
  var barrier = world.allKinds['barrier'];
  var playerKind = world.allKinds['player'];
  var bulletKind = world.allKinds['bullet'];
  var target = position.Clone();
  target.x += 100 * Math.cos(angle);
  target.y += 100 * Math.sin(angle);
  world.boxWorld.RayCast(function (fixture, point, normal, fraction) {
    var thing = fixture.GetBody().GetUserData();
    var kind = thing.kind;
    if (kind === playerKind || kind === bulletKind ||
        kind === wall || kind === barrier) {
      player.laserTarget.Copy(point);
      actor.scaleX = 170 * fraction;
      if (kind === bulletKind)
        player.laserBulletTarget = thing;
      else
        player.laserBulletTarget = null;
      return fraction;  // Only look for fixtures closer than this one.
    } else {
      return -1;  // Ignore this fixture and continue.
    }
  }, position, target);

  var body = player.laser.body;
  body.SetPositionXY(0.5 * (position.x + player.laserTarget.x),
                     0.5 * (position.y + player.laserTarget.y));
  body.SetAngleRadians(angle);
}

function shoot(player, index) {
  var weapon = weapons[player.weapon];
  player.shootTime++;
  if (player.shootTime >= weapon.shootTime) {
    player.shootTime = 0;
    weapon.shoot(player, index);
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
    shootTime: 1000,
    shoot: function () {},
  },
  {  // Gun
    shootTime: 30,
    shoot: function (player, index) {
      weaponShoot(player, index, 0, [1, 1], null, 30);
    },
  },
  {  // Multi-shot
    shootTime: 60,
    shoot: function (player, index) {
      for (var i = -1; i < 2; i += 1) {
        weaponShoot(player, index, 0.1 * i, [1, 1]);
      }
    },
  },
  {  // Grenade
    shootTime: 60,
    shoot: function (player, index) {
      weaponShoot(player, index, 0, [2, 2]);
    },
  },
  {  // Missile
    shootTime: 60,
    shoot: function (player, index) {
      weaponShoot(player, index, 0, [3, 1]);
    },
  },
  {  // Laser
    shootTime: 15,
    shoot: function (player, index) {
      var bullet = player.laserBulletTarget;
      if (bullet) {
        var body = bullet.body;
        makeDebris(0.6, body.GetPosition(), body.GetLinearVelocity(),
                   bullet.actor.getFrame(), 5, 'bullet');
        if (!bullet.destroyed) {
          destroyBullet(bullet);
          bulletsDestroyed[index].textContent++;
        }
      } else {
        weaponShoot(player, index, 0, [1, 1], player.laserTarget);
      }
    },
  },
];

function weaponShoot(
    player, index, angleDelta, scale, altPosition, altSpeed) {
  var position = altPosition || player.body.GetPosition();
  var angle = player.body.GetAngleRadians() + angleDelta;
  var velocity = player.body.GetLinearVelocity().Clone();
  var speed = altSpeed || 20;
  velocity.x += speed * Math.cos(angle);
  velocity.y += speed * Math.sin(angle);
  makeBullet(position, angle, velocity, index, scale);
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

function getFillStyle(value) {
  var color = colors[value];
  return 'rgba(' +
         color[0] + ', ' +
         color[1] + ', ' +
         color[2] + ', 0.5)';
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

function keyDown(event) {
  keyPressed[event.keyCode] = 1;
};

function keyUp(event) {
  keyPressed[event.keyCode] = 0;
};

window.addEventListener('load', start);

