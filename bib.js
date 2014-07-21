'use strict';

// namespace BIB
var BIB = {};

BIB.arrayTob2Vec2 = function (array) {
  var	b2Vec2		      = box2d.b2Vec2;

  if (Array.isArray(array) && array.length == 2) {
    return new b2Vec2(array[0], array[1]);
  } else if (array instanceof b2Vec2) {
    return array.Clone();
  }
  return null;
};

/**
 * The main object. Takes ownership (via stage) of the canvas.
 */
BIB.World = function (canvasId) {
  var	b2Vec2		      = box2d.b2Vec2,
      b2World		      = box2d.b2World;

  // Member fields.

  // View.
  this.pixelsPerMeter = 0;
  this.viewSize = null;
  this.viewPosition = null;
  this.viewOffset = null;  // Offset in pixels.

  // Kinds and Sets.
  this.allAnimations = {};
  this.allKinds = {};
  this.allSets = {};

  // Box2D.
  this.boxWorld = null;
  // Used to attach joints to 'nothing'.
  this.groundBody = null;
  // Used to generate collisionFilters, maximum of 32 categories.
  this.collisionCategories = {};
  // Closures executed at start of frame.
  this.collisionEvents = [];

  // IvanK
  this.canvas = null;  // The canvas that we're drawing to.
  this.stage = null;
  // Default layer is 0, plus numLayers on either side [-numLayers, numLayers].
  this.numLayers = 5;
  this.skeletonLayer = null;

  // Mouse / touch.
  this.mousePosition = null;
  this.pointerInteractions = {};
  // User supplied callbacks.
  this.onPointerDown = function (interaction) {};
  this.onPointerMove = function (interaction) {};
  this.onPointerUp = function (interaction) {};

  // Main loop.
  this.onEnterFrameActions;  // Callback provided by client.
  this.pause = false;  // If true, don't step the Box2D world.
  this.started = false;

  // Initialization.
  var that = this;

  // Create Box2D world.
  this.boxWorld = new b2World(new b2Vec2(0, 0));
  this.boxWorld.SetContactListener(new BIB.ContactListener(this));
  this.groundBody = this.boxWorld.CreateBody(new box2d.b2BodyDef());

  // Set initial view parameters.
  this.viewSize = new b2Vec2(15, 10);
  this.viewPosition = new b2Vec2(0, 0);

  // Set clients loop callback.
  this.onEnterFrameActions = function () {};
  this.pause = false;

  this.canvas = document.getElementById(canvasId);
  // Add an event listener to resize the canvas.
  // This needs to be done before creating the Stage as the stage will resize
  // itself based on the canvas.
  this.resizeCanvas();
  window.addEventListener("resize", function () { that.resizeCanvas(); });

  // Create IvanK stage. Required to load images.
  this.stage = new Stage(canvasId);
  for (var i = -this.numLayers; i <= this.numLayers; i++) {
    this.stage.addChild(new DisplayObjectContainer());
  }
  this.skeletonLayer = new DisplayObjectContainer();
  this.skeletonLayer.visible = false;
  this.stage.addChild(this.skeletonLayer);

  // Add an event listener to resize the game scale when the stage changes.
  this.updateView();
  this.stage.addEventListener('resize', function (e) { that.updateView(); });

  // Store the event listener functions so that they can be removed later.
  var that = this;
  this.eventListeners = {
    onMouseDown: function (e) { that.onMouseDown(e); },
    onMouseMove: function (e) { that.onMouseMove(e); },
    onMouseUp: function (e) { that.onMouseUp(e); },
    onTouchStart: function (e) { that.onTouchStart(e); },
    onTouchMove: function (e) { that.onTouchMove(e); },
    onTouchEnd: function (e) { that.onTouchEnd(e); },
    onEnterFrame: function (e) { that.onEnterFrame(e); },
  };
};

BIB.World.prototype.setGravity = function (gravity) {
  var gravityVector = BIB.arrayTob2Vec2(gravity);
  if (gravityVector) {
    this.boxWorld.SetGravity(gravityVector);
  }
};

BIB.World.prototype.resizeCanvas = function () {
  var maxWidth = this.canvas.parentNode.offsetWidth;
  var maxHeight = this.canvas.parentNode.offsetHeight;
  var unitSize = Math.min(maxWidth / this.viewSize.x,
                           maxHeight / this.viewSize.y);
  var targetWidth = unitSize * this.viewSize.x;
  var targetHeight = unitSize * this.viewSize.y;
  // Only adjust if there's more than 1 pixel change. This prevents thrashing
  // when zooming at the same aspect ratio.
  var totalChange = Math.abs(this.canvas.width - targetWidth) +
                    Math.abs(this.canvas.height - targetHeight);
  if (totalChange > 1) {
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;
  }
};

BIB.World.prototype.load = function (descriptors, onLoadComplete) {
  var that = this;

  descriptors.animations = descriptors.animations || [];
  descriptors.loadAnimations = descriptors.loadAnimations || [];
  descriptors.kinds = descriptors.kinds || [];
  descriptors.loadKinds = descriptors.loadKinds || [];
  descriptors.sets = descriptors.sets || [];
  descriptors.loadSets = descriptors.loadSets || [];

  var loadData = {
    descriptors: descriptors,
    onLoadComplete: onLoadComplete || function () {},
    // This represents the number of files and images still loading.
    itemsRemaining: 0,
  };

  var increment = function (file) {
    //console.log('Loading ' + file);
    loadData.itemsRemaining++;
  };

  // Callback to decrement |itemsRemaining| and init if it is zero.
  var decrementAndCheck = function (file) {
    //console.log('Loaded ' + file);
    loadData.itemsRemaining--;
    if (!loadData.itemsRemaining) {
      that.initWhenLoadComplete(loadData);
    }
  };

  // Increment to wait for all inline descriptors to be loaded.
  increment('inline descriptors');

  // Start loading animations.
  // Callback for processing an animation.
  var addAnimation = function (animation) {
    increment(animation.file);
    that.allAnimations[animation.name] = new BIB.Animation(animation);
    BIB.getImageData(animation.file, function () {
      decrementAndCheck(animation.file);
    });
  };
  // Load passed in animations.
  BIB.validateAnimationDescriptors(descriptors.animations);
  descriptors.animations.forEach(function (animation) {
    addAnimation(animation);
  });
  // Load animation descriptors from json files.
  descriptors.loadAnimations.forEach(function (file) {
    increment(file);
    BIB.getFileData(
        file,
        function (fileData) {
          var json = fileData.json;
          BIB.validateAnimationDescriptors(json);
          json.forEach(function (element) {
            addAnimation(element);
          });
          decrementAndCheck(fileData.file);
        });
  });

  // Start loading Kinds.
  // Load passed in Kinds.
  BIB.validateKindDescriptors(descriptors.kinds);
  descriptors.kinds.forEach(function (kind) {
    this.setKind(kind);
  }, this);
  // Load Kind descriptors from json files.
  descriptors.loadKinds.forEach(function (file) {
    increment(file);
    BIB.getFileData(
        file,
        function (fileData) {
          var json = fileData.json;
          BIB.validateKindDescriptors(json);
          json.forEach(function (element) {
            that.setKind(element);
          });
          decrementAndCheck(fileData.file);
        });
  });

  // Start loading Sets.
  // Load passed in Sets.
  BIB.validateSetDescriptors(descriptors.sets);
  descriptors.sets.forEach(function (currentSet) {
    this.allSets[currentSet.name] = currentSet.things;
  }, this);
  // Load Sets from json files.
  descriptors.loadSets.forEach(function (file) {
    increment(file);
    BIB.getFileData(
        file,
        function (fileData) {
          var json = fileData.json;
          BIB.validateSetDescriptors(json);
          json.forEach(function (element) {
            that.allSets[element.name] = element.things;
          });
          decrementAndCheck(fileData.file);
        });
  });

  // Decrement the extra one added at the start.
  decrementAndCheck('inline descriptors');
};

BIB.World.prototype.initWhenLoadComplete = function (loadData) {
  // Get all loaded animations.
  var animations = loadData.descriptors.animations;
  loadData.descriptors.loadAnimations.forEach(function (animationsFile) {
    animations = animations.concat(BIB.fileCache[animationsFile].json);
  });

  // Init animations.
  animations.forEach(function (animation) {
    this.allAnimations[animation.name].initialize();
  }, this);

  // Get all loaded Kinds.
  var kinds = loadData.descriptors.kinds;
  loadData.descriptors.loadKinds.forEach(function (kindsFile) {
    kinds = kinds.concat(BIB.fileCache[kindsFile].json);
  });

  // Init Kind objects.
  kinds.forEach(function (kind) {
    this.allKinds[kind.name].initialize();
  }, this);

  // Get all loaded sets.
  var sets = loadData.descriptors.sets;
  loadData.descriptors.loadSets.forEach(function (setsFile) {
    sets = sets.concat(BIB.fileCache[setsFile].json);
  });

  // Call clients onLoadComplete callback.
  var loadedItems = { animations: animations, kinds: kinds, sets: sets };
  loadData.onLoadComplete(this, loadedItems);
};

BIB.World.prototype.unload = function () {
  // Delete every element, but keep original dicts.
  for (var s in this.allSets) {
    delete this.allSets[s];
  }
  for (var k in this.allKinds) {
    this.allKinds[k].forEachThing(function (thing) { thing.destroy(); });
    delete this.allKinds[k];
  }
  for (var a in this.allAnimations) {
    delete this.allAnimations[a];
  }
}

BIB.World.prototype.pixelsToPosition = function (offsetX, offsetY) {
  var b2Vec2          = box2d.b2Vec2;

  var position = new b2Vec2(offsetX, offsetY);
  position.SelfSub(this.viewOffset);
  position.SelfMul(1 / this.pixelsPerMeter);
  return position;
};

BIB.World.prototype.setViewSize = function (viewSize) {
  this.viewSize = BIB.arrayTob2Vec2(viewSize) || this.viewSize;
  this.updateView();
  this.resizeCanvas();
};

BIB.World.prototype.setViewPosition = function (viewPosition) {
  this.viewPosition = BIB.arrayTob2Vec2(viewPosition) || this.viewPosition;
  this.updateView();
};

BIB.World.prototype.updateView = function () {
  var	b2Vec2          = box2d.b2Vec2;

  this.pixelsPerMeter = Math.min(this.stage.stageWidth / this.viewSize.x,
                                 this.stage.stageHeight / this.viewSize.y);

  this.viewOffset = new b2Vec2(
      this.stage.stageWidth * 0.5 - this.viewPosition.x * this.pixelsPerMeter,
      this.stage.stageHeight * 0.5 - this.viewPosition.y * this.pixelsPerMeter);

  var stage = this.stage;
  stage.scaleX = this.pixelsPerMeter;
  stage.scaleY = this.pixelsPerMeter;
  stage.x = this.viewOffset.x;
  stage.y = this.viewOffset.y;
};

BIB.World.prototype.fromView = function (position) {
  var newPosition = position.Clone();
  newPosition.SelfSub(this.viewPosition);
  return newPosition;
};

BIB.ContactListener = function (world) {
  box2d.b2ContactListener.call(this);
  this.world = world;
};
BIB.ContactListener.prototype = new box2d.b2ContactListener();
BIB.ContactListener.prototype.BeginContact = function (contact) {
  var fixtureA = contact.GetFixtureA();
  var fixtureB = contact.GetFixtureB();
  var thingA = fixtureA.GetBody().GetUserData();
  var thingB = fixtureB.GetBody().GetUserData();
  var actionAB = thingA.kind.beginContactActions[thingB.kind.name];
  var actionBA = thingB.kind.beginContactActions[thingA.kind.name];
  if (actionAB) {
    this.world.collisionEvents.push(function () {
      actionAB(thingA, thingB, fixtureA, fixtureB);
    });
  }
  if (actionBA) {
    this.world.collisionEvents.push(function () {
      actionBA(thingB, thingA, fixtureB, fixtureA);
    });
  }
};
BIB.ContactListener.prototype.EndContact = function (contact) {
  var fixtureA = contact.GetFixtureA();
  var fixtureB = contact.GetFixtureB();
  var thingA = fixtureA.GetBody().GetUserData();
  var thingB = fixtureB.GetBody().GetUserData();
  var actionAB = thingA.kind.endContactActions[thingB.kind.name];
  var actionBA = thingB.kind.endContactActions[thingA.kind.name];
  if (actionAB) {
    this.world.collisionEvents.push(function () {
      actionAB(thingA, thingB, fixtureA, fixtureB);
    });
  }
  if (actionBA) {
    this.world.collisionEvents.push(function () {
      actionBA(thingB, thingA, fixtureB, fixtureA);
    });
  }
};
BIB.ContactListener.prototype.PostSolve = function (contact, impulse) {};
BIB.ContactListener.prototype.PreSolve = function (contact, oldManifold) {};


// Start rendering and looping.
BIB.World.prototype.start = function () {
  if (this.started) {
    return;
  }

  // Setup pointer callbacks.
  this.canvas.addEventListener('mousedown', this.eventListeners.onMouseDown);
  // Listen on the window so that a click that starts on the canvas and moves
  // off is handled the same as a touch.
  window.addEventListener('mousemove', this.eventListeners.onMouseMove);
  window.addEventListener('mouseup', this.eventListeners.onMouseUp);
  this.canvas.addEventListener('touchstart', this.eventListeners.onTouchStart);
  this.canvas.addEventListener('touchmove', this.eventListeners.onTouchMove);
  this.canvas.addEventListener('touchend', this.eventListeners.onTouchEnd);

  // Start the loop.
  this.stage.addEventListener(
      Event.ENTER_FRAME, this.eventListeners.onEnterFrame);

  this.started = true;
};

BIB.World.prototype.onEnterFrame = function () {
  if (!this.pause) {
    // Step boxWorld.
    this.boxWorld.Step(1 / 60, 3, 3);

    // Process collisions.
    this.collisionEvents.forEach(function (action) {
      action();
    });
    this.collisionEvents = [];

    // Do user defined stuff.
    this.onEnterFrameActions(this);
  }

  // update actors
  var that = this;
  for (var k in this.allKinds) {
    var kind = this.allKinds[k].forEachThing(function (thing) {
      if (thing.animation || that.skeletonLayer.visible) {
        var body = thing.body;
        var position = body.GetPosition();
        var rotation = body.GetAngleRadians() * 180 / Math.PI;
        var actor = thing.actor;
        actor.x = position.x;
        actor.y = position.y;
        actor.rotation = rotation;
        if (!that.pause) {
          actor.step(1 / 60);
        }
        if (that.skeletonLayer.visible && thing.skeleton) {
          var skeleton = thing.skeleton;
          skeleton.x = position.x;
          skeleton.y = position.y;
          skeleton.rotation = rotation;
        }
      }
    });
  }
};

BIB.World.prototype.stop = function () {
  if (!this.started) {
    return;
  }

  this.canvas.removeEventListener('mousedown', this.eventListeners.onMouseDown);
  window.removeEventListener('mousemove', this.eventListeners.onMouseMove);
  window.removeEventListener('mouseup', this.eventListeners.onMouseUp);
  this.canvas.removeEventListener(
      'touchstart', this.eventListeners.onTouchStart);
  this.canvas.removeEventListener('touchmove', this.eventListeners.onTouchMove);
  this.canvas.removeEventListener('touchend', this.eventListeners.onTouchEnd);
  this.stage.removeEventListener(
      Event.ENTER_FRAME, this.eventListeners.onEnterFrame);

  // Simulate a release of all touches and mouse clicks.
  for (var i in this.pointerInteractions) {
    var interaction = this.pointerInteractions[i];
    if (interaction) {
      interaction.mouseEvent = null;
      interaction.touchEvent = null;
      this.doOnPointerUp(interaction);
      delete this.pointerInteractions[i];
    }
  };

  this.started = false;
};

// Added within IvanK framework.

/**
 * A DisplayObjectContainer that adds to its children one Bitmap for each frame
 * of a BIB.Animation. It animates them by setting |visible| and |alpha| on each
 * Bitmap.
 */
function AnimatedBitmap(additionalOffset)
{
  DisplayObjectContainer.call(this);

  // This actors parent Thing.
  this.thing = null;

  // By default (onAnimationFinished == null) animation stops on the last
  // frame (or first if speed is negative).
  // If onAnimationFinished is set, it will be called with |this.thing| and its
  // return value will determine whether to continue the animation.
  // E.g. Set this to AnimatedBitmap.LOOP to loop the animation.
  // Otherwise, set a custom function to do other actions.
  this.onAnimationFinished = null;

  // Additional offset of this animation from the Thing.
  this.additionalOffset = additionalOffset;
  // Seconds taken to play the animation.
  this.speed = 0;
  // Current position of the animation as a proportion in [0, 1).
  this.instant = 0;

  this.setInstant(0);
}
AnimatedBitmap.prototype = new DisplayObjectContainer();

/**
 * Sets the animation.
 */
AnimatedBitmap.prototype.setAnimation = function (animation) {
  this.removeChildren();
  if (!animation) {
    return;
  }
  animation.bitmapData.forEach(function (bitmapData) {
    var bitmap = new Bitmap(bitmapData);
    var offsetX = animation.offset.x + this.additionalOffset.x;
    var offsetY = animation.offset.y + this.additionalOffset.y;
    bitmap.scaleX = animation.size.x / animation.width;
    bitmap.scaleY = animation.size.y / animation.height;
    bitmap.x = animation.size.x * (-0.5 + offsetX);
    bitmap.y = animation.size.y * (-0.5 + offsetY);
    bitmap.visible = false;
    this.addChild(bitmap);
  }, this);
  this.speed = animation.speed;
  // Set the alpha and blendMode (in DisplayObject).
  this.alpha = animation.alpha;
  this.blendMode = animation.blendMode;

  // Make the current frame visible.
  this.setInstant(this.instant);
}

/**
 * Sets the current position in the animation.
 */
AnimatedBitmap.prototype.setInstant = function (instant)
{
  if (this.numChildren == 0) {
    return;
  }

  // Bound instant to [0, 1).
  instant = instant % 1;
  if (instant < 0) {
    instant += 1;
  }

  var currentFrame = (this.numChildren * this.instant) | 0;
  var newFrame = (this.numChildren * instant) | 0;

  this.getChildAt(currentFrame).visible = false;
  this.getChildAt(newFrame).visible = true;

  this.instant = instant;
}

/**
 * Get and set the current frame.
 */
AnimatedBitmap.prototype.getFrame = function (frame) {
  return (this.numChildren * this.instant) | 0;
}
AnimatedBitmap.prototype.setFrame = function (frame) {
  this.setInstant(frame / this.numChildren);
}

/**
 * Steps the animation by the time interval.
 */
AnimatedBitmap.prototype.step = function (interval)
{
  if (this.speed == 0) {
    return;
  }

  var newInstant = (this.instant + (interval / this.speed) % 1);

  // If the animation is finished, don't proceed.
  if ((newInstant >= 1 || newInstant < 0) &&
      (!this.onAnimationFinished || !this.onAnimationFinished(this.thing))) {
    return;
  }
  this.setInstant(newInstant);
}

/**
 * Do nothing and return true to have the animation loop.
 */
AnimatedBitmap.LOOP = function (thing) { return true; };
BIB.Animation = function (animation) {
  var b2Vec2          = box2d.b2Vec2;

  this.name = animation.name;
  this.file = animation.file;

  // The BIB size (in meters) of each frame.
  this.size = BIB.arrayTob2Vec2(animation.size) || new b2Vec2(1, 1);

  // The BIB offset. Used to set the origin relative to the frame.
  this.offset = BIB.arrayTob2Vec2(animation.offset) || new b2Vec2();

  // The default alpha value.
  this.alpha = (typeof animation.alpha == 'number') ? animation.alpha : 1;

  // The time in seconds to play this animation.
  this.speed = (typeof animation.speed == 'number') ? animation.speed : 0;

  // Number of frames in each direction.
  this.gridDimensions =
      BIB.arrayTob2Vec2(animation.gridDimensions) || new b2Vec2();
  this.gridDimensions.x = this.gridDimensions.x || 1;
  this.gridDimensions.y = this.gridDimensions.y || 1;
  // Total number of frames.
  this.frameCount = animation.frameCount ||
                    this.gridDimensions.x * this.gridDimensions.y;
  // The first frame.
  this.frameOffset = animation.frameOffset || 0;

  // A BitmapData of each frame.
  this.bitmapData = [];
  // The size of each frame in image pixels.
  this.width;
  this.height;

  // The default blend mode.
  this.blendMode = (typeof animation.blendMode == 'string')
      ? animation.blendMode : 'normal';
};

BIB.Animation.prototype.initialize = function () {
  var image = BIB.getImageData(this.file).image;
  var skip = this.frameOffset;
  this.width = (image.width / this.gridDimensions.x) | 0;
  this.height = (image.height / this.gridDimensions.y) | 0;
  for (var y = 0; y < this.gridDimensions.y; y++) {
    for (var x = 0; x < this.gridDimensions.x; x++) {
      if (skip > 0) {
        skip--;
        continue;
      }
      if (this.bitmapData.length == this.frameCount) {
        return;
      }
      var x0 = x * this.width;
      var y0 = y * this.height;
      this.bitmapData.push(new BitmapData(new SubImage(
          image, x0, y0, this.width, this.height)));
    }
  }
};

BIB.imageCache = {};
BIB.fileCache = {};

BIB.ImageData = function (file) {
  this.file = file;
  this.image = new Image();
  this.callbacks = [];

  var that = this;
  this.image.onload = function () {
    that.callbacks.forEach(function (callback) {
      callback(that);
    });
    that.callbacks = null;
  }
  this.image.src = file;
};

BIB.getImageData = function (file, callback) {
  var imageData = BIB.imageCache[file] || new BIB.ImageData(file);
  BIB.imageCache[file] = imageData;

  if (callback) {
    if (imageData.callbacks === null) {
      callback(imageData);
    } else {
      imageData.callbacks.push(callback);
    }
  }

  return imageData;
};

BIB.FileData = function (file) {
  this.file = file;
  this.data;
  this.json;
  this.callbacks = [];

  var xhr = new XMLHttpRequest();
  xhr.open('GET', file);
  var that = this;
  xhr.onload = function (e) {
    that.data = this.response;
    try {
      that.json = JSON.parse(this.response);
    } catch (e) {}
    that.callbacks.forEach(function (callback) {
      callback(that);
    });
    that.callbacks = null;
  };
  xhr.send();
};

BIB.getFileData = function (file, callback) {
  var fileData = BIB.fileCache[file] || new BIB.FileData(file);
  BIB.fileCache[file] = fileData;

  if (callback) {
    if (fileData.callbacks === null) {
      callback(fileData);
    } else {
      fileData.callbacks.push(callback);
    }
  }

  return fileData;
};

BIB.World.prototype.updateMousePosition = function (e) {
  var b2Vec2          = box2d.b2Vec2;

  this.mousePosition = new b2Vec2(e.offsetX, e.offsetY);
  this.mousePosition.SelfSub(this.viewOffset);
  this.mousePosition.SelfMul(1 / this.pixelsPerMeter);
};

BIB.PointerInteraction = function (id, world) {
  this.id = id;
  this.world = world;
  this.mouseEvent = null;
  this.touchEvent = null;
  this.touch = null;
  this.position = null;
  this.thing = null;
};

BIB.World.prototype.doOnPointerDown = function (interaction) {
  var thing = this.getThingAtPosition(interaction.position);
  if (thing) {
    interaction.thing = thing;
  }
  this.onPointerDown(interaction);
  if (thing && thing.kind.onPointerDown) {
    thing.kind.onPointerDown(interaction);
  }
};

BIB.World.prototype.doOnPointerMove = function (interaction) {
  this.onPointerMove(interaction);
  if (interaction.thing && interaction.thing.kind.onPointerMove) {
    interaction.thing.kind.onPointerMove(interaction);
  }
};

BIB.World.prototype.doOnPointerUp = function (interaction) {
  this.onPointerUp(interaction);
  if (interaction.thing) {
    if (interaction.thing.kind.onPointerUp) {
      interaction.thing.kind.onPointerUp(interaction);
    }
    interaction.thing = null;
  }
};

// Interaction id for the mouse pointer interaction.
BIB.mouseInteractionId = 0;

BIB.World.prototype.onMouseDown = function (e) {
  if (e.button !== 0) {
    return;
  }

  this.updateMousePosition(e);
  var interaction = new BIB.PointerInteraction(BIB.mouseInteractionId, this);
  this.pointerInteractions[BIB.mouseInteractionId] = interaction;
  interaction.mouseEvent = e;
  interaction.position = this.mousePosition;
  this.doOnPointerDown(interaction);
};

BIB.World.prototype.onMouseMove = function (e) {
  var interaction = this.pointerInteractions[BIB.mouseInteractionId];
  if (!interaction) {
    return;
  }

  if (e.which === 0) {
    // An interaction exists but e.which is 0, so we must have missed the
    // mouseUp.
    this.onMouseUp(e);
    return;
  }

  this.updateMousePosition(e);
  interaction.mouseEvent = e;
  interaction.position = this.mousePosition;
  this.doOnPointerMove(interaction);
};

BIB.World.prototype.onMouseUp = function (e) {
  var interaction = this.pointerInteractions[BIB.mouseInteractionId];
  if (e.button !== 0 || !interaction) {
    return;
  }

  interaction.mouseEvent = e;
  interaction.position = this.mousePosition;
  this.doOnPointerUp(interaction);
  delete this.pointerInteractions[BIB.mouseInteractionId];
};

BIB.World.prototype.getTouchPosition = function (touch) {
  var rect = touch.target.getBoundingClientRect();
  return this.pixelsToPosition(touch.pageX - rect.left, touch.pageY - rect.top);
};

BIB.World.prototype.onTouchStart = function (e) {
  e.preventDefault();
  var touches = e.changedTouches;

  for (var t = 0; t < touches.length; t++) {
    var touch = touches[t];
    var interaction = new BIB.PointerInteraction(touch.identifier, this);
    this.pointerInteractions[touch.identifier] = interaction;
    interaction.touchEvent = e;
    interaction.touch = touch;
    interaction.position = this.getTouchPosition(touch);
    this.doOnPointerDown(interaction);
  }
};

BIB.World.prototype.onTouchMove = function (e) {
  e.preventDefault();
  var touches = e.changedTouches;

  for (var t = 0; t < touches.length; t++) {
    var touch = touches[t];
    var interaction = this.pointerInteractions[touch.identifier];
    if (!interaction) {
      continue;
    }
    interaction.touchEvent = e;
    interaction.touch = touch;
    interaction.position = this.getTouchPosition(touch);
    this.doOnPointerMove(interaction);
  }
};

BIB.World.prototype.onTouchEnd = function (e) {
  e.preventDefault();
  var touches = e.changedTouches;

  for (var t = 0; t < touches.length; t++) {
    var touch = touches[t];
    var interaction = this.pointerInteractions[touch.identifier];
    if (!interaction) {
      continue;
    }
    interaction.touchEvent = e;
    interaction.touch = touch;
    interaction.position = this.getTouchPosition(touch);
    this.doOnPointerUp(interaction);
    delete this.pointerInteractions[touch.identifier];
  }
};

BIB.World.prototype.getThingAtPosition = function (position) {
  var b2Vec2          = box2d.b2Vec2,
      b2AABB          = box2d.b2AABB;

  var aabb = new b2AABB();
  var delta = new b2Vec2(0.001, 0.001);
  aabb.lowerBound.Copy(position);
  aabb.lowerBound.SelfSub(delta);
  aabb.upperBound.Copy(position);
  aabb.upperBound.SelfAdd(delta);

  var thing = null;
  // Query the boxWorld for overlapping shapes.
  var that = this;
  var getThingCallback = function (fixture) {
    return that.getThingCallback(fixture, position,
                                 function (foundThing) { thing = foundThing; });
  };
  this.boxWorld.QueryAABB(getThingCallback, aabb);
  return thing;
};

BIB.World.prototype.getThingCallback = function (fixture, position, callback) {
  var b2Body		      = box2d.b2Body;

  var body = fixture.GetBody();
  var thing = body.GetUserData();
  if (thing.kind.onPointerDown) {
     if (fixture.GetShape().TestPoint(body.GetTransform(), position)) {
       callback(thing);
       return false;
     }
  }
  return true;
};

BIB.World.prototype.setKind = function (descriptor) {
  descriptor = JSON.parse(JSON.stringify(descriptor));
  var name = descriptor.name;
  var kind = this.allKinds[name] || new BIB.Kind(this);
  // Update our Kind with all properties supplied in the descriptor.
  for (var field in descriptor) {
    kind[field] = descriptor[field];
  }
  this.allKinds[name] = kind;
  return kind;
};

BIB.Fixture = function (kind, fixture, previousFixture) {
  var	b2Vec2		      = box2d.b2Vec2,
      b2FixtureDef    = box2d.b2FixtureDef;

  this.kind = kind;

  var f = fixture || {};
  var pf = previousFixture || {};

  // The type of shape: 'circle', 'box', 'polygon'.
  var shapeTypes = ['circle', 'box', 'polygon', 'chain', 'loop'];
  this.shapeType = shapeTypes.indexOf(f.shapeType) == -1 ? 'box' : f.shapeType;
  // The data required to define the shapeType.
  //   circle: radius
  //   box: halfWidth | [halfWidth, halfHeight]
  //   polygon|chain|loop: [[x0,y0], [x1,y1], ...]
  this.shapeData = f.shapeData || 0.5;

  var p = f.properties || pf.properties || {};
  // Properties of the b2FixtureDef.
  this.properties = {
    density: (typeof p.density == 'number') ? p.density : 10,
    friction: (typeof p.friction == 'number') ? p.friction : 0.5,
    restitution: (typeof p.restitution == 'number') ? p.restitution : 0.2,
    isSensor: p.isSensor ? true : false,
  };

  var c = f.collisionFilter || pf.collisionFilter || {};
  // Used to generate collisionFilter.
  this.collisionFilter = {
    // List of categories this Kind belongs to. Set to [] for no collisions.
    collisionCategories: c.collisionCategories || ['default'],
    // By default, all Kinds collide with all categories. Explicitly select
    // categories with onlyCollidesWith, or exclude categories with
    // doesNotCollideWith.
    onlyCollidesWith: c.onlyCollidesWith || [],
    doesNotCollideWith: c.doesNotCollideWith || [],
  };

  var fixDef = this.fixDef = new b2FixtureDef();
  fixDef.density = this.properties.density;
  fixDef.friction = this.properties.friction;
  fixDef.restitution = this.properties.restitution;
  fixDef.isSensor = this.properties.isSensor;
  fixDef.filter = this.kind.world.buildCollisionFilter(this.collisionFilter);
};

BIB.Kind = function (world) {
  var	b2Vec2          = box2d.b2Vec2;

  // The BIB.World.
  this.world = world;

  // The name of this Kind.
  this.name;

  // The default animation to use.
  this.animation;
  // Position of the animation relative to the object.
  this.animationOffset = new b2Vec2();

  // A list of fixtures.
  this.fixtures = [];

  // 'dynamic', 'static', or 'kinematic' as per b2Body.type
  this.movementType = 'dynamic';

  // Properties of the b2BodyDef.
  this.linearDamping = 0;
  this.angularDamping = 0.01;
  this.fixedRotation = false;

  // Actions to take when two things collide.
  // Map of the name of the other Kind to a
  // function(thisThing, otherThing, thisFixture, otherFixture).
  this.beginContactActions = {};
  this.endContactActions = {};

  // Action to take upon interaction with mouse or touch.
  // Functions take a BIB.PointerInteraction.
  this.onPointerDown;
  this.onPointerMove;
  this.onPointerUp;

  // PRIVATE

  // b2BodyDef;
  this.bodyDef;
  // List of Things of this Kind.
  this.things;
  // Used to give unique keys to Things.
  this.nextThingIndex;
};

BIB.shapeDataToArray = function (shapeData, scale) {
  var	b2Vec2          = box2d.b2Vec2;

  var array = new Array();
  if (Array.isArray(shapeData)) {
    shapeData.forEach(function (element) {
      var vertex = BIB.arrayTob2Vec2(element);
      if (vertex) {
        array.push(new b2Vec2(vertex.x * scale.x,
                              vertex.y * scale.y));
      }
    });
  }
  return array;
};

BIB.buildShape = function (shapeType, shapeData, scale) {
  var	b2Vec2          = box2d.b2Vec2,
      b2ChainShape    = box2d.b2ChainShape,
      b2PolygonShape  = box2d.b2PolygonShape,
      b2CircleShape   = box2d.b2CircleShape;

  if (shapeType == 'circle') {
    var radius = (typeof shapeData == 'number') ? shapeData : 0.5;
    return new b2CircleShape(radius * scale.x);
  }
  if (shapeType == 'box') {
    var halfWidth = 0.5;
    var halfHeight = 0.5;
    if (shapeData) {
      if (typeof shapeData == 'number') {
        halfWidth = halfHeight = shapeData;
      } else if (shapeData.length == 2) {
        halfWidth = shapeData[0];
        halfHeight = shapeData[1];
      }
    }
    return new b2PolygonShape().SetAsBox(halfWidth * scale.x,
                                         halfHeight * scale.y);
  }
  if (shapeType == 'polygon') {
    return new b2PolygonShape().SetAsArray(
        BIB.shapeDataToArray(shapeData, scale));
  }
  if (shapeType == 'chain' || shapeType == 'loop') {
    var vertices = BIB.shapeDataToArray(shapeData, scale);
    return shapeType == 'loop'
        ? new b2ChainShape().CreateLoop(vertices)
        : new b2ChainShape().CreateChain(vertices);
  }
};

BIB.World.prototype.getOrAddCollisionCategory = function (category) {
  var cc = this.collisionCategories;
  if (cc[category] === undefined) {
    cc[category] = Object.keys(cc).length;
  }
  return cc[category];
};

BIB.World.prototype.buildCollisionFilter = function (params) {
  var b2Filter    = box2d.b2Filter;

  var collisionFilter = new b2Filter();
  collisionFilter.categoryBits = 0x00000000;
  collisionFilter.maskBits = 0xFFFFFFFF;

  var cc = params.collisionCategories;
  for (var c in cc) {
    collisionFilter.categoryBits |= 1 << this.getOrAddCollisionCategory(cc[c]);
  }

  var ocw = params.onlyCollidesWith;
  if (Array.isArray(ocw) && ocw.length > 0) {
    collisionFilter.maskBits = 0;
    for (var c in ocw) {
      collisionFilter.maskBits |=
          1 << this.getOrAddCollisionCategory(ocw[c]);
    }
  }

  var dncw = params.doesNotCollideWith;
  for (var c in dncw) {
    collisionFilter.maskBits &= ~(1 << this.getOrAddCollisionCategory(dncw[c]));
  }
  return collisionFilter;
};

BIB.Kind.prototype.initialize = function () {
  var	b2Vec2          = box2d.b2Vec2,
      b2Body          = box2d.b2Body,
      b2BodyType      = box2d.b2BodyType,
      b2BodyDef       = box2d.b2BodyDef;

  // Contains all Things of this Kind.
  this.things = this.things || [];
  this.nextThingIndex = this.nextThingIndex || 0;

  this.animationOffset = BIB.arrayTob2Vec2(this.animationOffset);

  for (var f = 0; f < this.fixtures.length; f++) {
    var fixture = this.fixtures[f];
    this.fixtures[f] = new BIB.Fixture(this, fixture, this.fixtures[f - 1]);
  }

  var bodyDef = this.bodyDef = new b2BodyDef();
  bodyDef.type = b2BodyType.b2_dynamicBody;
  if (this.movementType == 'kinematic') {
    bodyDef.type = b2BodyType.b2_kinematicBody;
  } else if (this.movementType == 'static') {
    bodyDef.type = b2BodyType.b2_staticBody;
  }
  bodyDef.linearDamping = this.linearDamping;
  bodyDef.angularDamping = this.angularDamping;
  bodyDef.fixedRotation = this.fixedRotation;
};

BIB.Kind.prototype.forEachThing = function (callback) {
  var t = 0;
  while (t < this.nextThingIndex) {
    var thing = this.things[t];
    callback(thing);
    if (this.things[t] == thing) {
      t++;
    }
  }
};

BIB.getDefaultParams = function (inputParams) {
  var	b2Vec2		      = box2d.b2Vec2;

  var build = BIB.arrayTob2Vec2;

  var p = inputParams || {};

  return {
    position: build(p.position) || new b2Vec2(0, 0),
    angle: (typeof p.angle == 'number') ? p.angle : 0,
    scale: build(p.scale) || new b2Vec2(1, 1),
    depth: (typeof p.depth == 'number') ? p.depth : 0,
    velocity: build(p.velocity) || new b2Vec2(0, 0),
    animation: p.animation,
    alpha: (typeof p.alpha == 'number') ? p.alpha : 1,
  };
};

BIB.World.prototype.getLayer = function (depth) {
  var childIndex = this.numLayers - depth;
  if (childIndex >= 0 && childIndex <= this.numLayers * 2) {
    return this.stage.getChildAt(childIndex);
  }
  console.error('Invalid depth: ' + depth);
  return null;
};

BIB.buildSkeleton = function (body) {
  var skeleton = new Sprite();
  skeleton.graphics.lineStyle(0.02);  // Thickness in IvanK.
  for (var f = body.GetFixtureList(); f; f = f.GetNext()) {
    var shape = f.GetShape();
    if (shape.m_vertices) {
      var vertex = shape.m_vertices[shape.m_count - 1];
      skeleton.graphics.moveTo(vertex.x, vertex.y);
      for (var v = 0; v < shape.m_count; v++) {
        var vertex = shape.m_vertices[v];
        skeleton.graphics.lineTo(vertex.x, vertex.y);
      }
    } else {
      var r = shape.m_radius;
      var c = r * 0.55;
      skeleton.graphics.moveTo(r, 0);
      skeleton.graphics.cubicCurveTo(r, c, c, r, 0, r);
      skeleton.graphics.cubicCurveTo(-c, r, -r, c,  -r, 0);
      skeleton.graphics.cubicCurveTo(-r, -c, -c, -r,  0, -r);
      skeleton.graphics.cubicCurveTo(c, -r, r, -c,  r, 0);
    }
  }
  return skeleton;
};

/**
 * Takes a dict of initial parameters:
 *   position: in meters {x, y}
 *   angle: in radians (like Box2D)
 *   scale: factor {x, y}
 *   velocity: {x, y}
 */
BIB.World.prototype.newThing = function (kindName, initialParams) {
  var p = BIB.getDefaultParams(initialParams);
  var k = this.allKinds[kindName];

  k.bodyDef.position.Copy(p.position);
  k.bodyDef.angle = p.angle;
  k.bodyDef.linearVelocity.Copy(p.velocity);

  var body = this.boxWorld.CreateBody(k.bodyDef);

  k.fixtures.forEach(function (fixture) {
    fixture.fixDef.shape =
        BIB.buildShape(fixture.shapeType, fixture.shapeData, p.scale);
    body.CreateFixture(fixture.fixDef);
  });

  var actor = new AnimatedBitmap(k.animationOffset);
  actor.scaleX = p.scale.x;
  actor.scaleY = p.scale.y;
  var animationName = p.animation || k.animation;
  if (animationName) {
    var animation = this.allAnimations[animationName];
    actor.setAnimation(animation);
  }
  actor.alpha *= p.alpha;
  this.getLayer(p.depth).addChild(actor);

  var skeleton = BIB.buildSkeleton(body);
  this.skeletonLayer.addChild(skeleton);

  var index = k.nextThingIndex;
  var t = new BIB.Thing(k, index, body, actor, p.depth, animationName,
                        skeleton);
  body.SetUserData(t);
  actor.thing = t;
  k.things[index] = t;
  k.nextThingIndex++;
  return t;
};

BIB.World.prototype.newThingsFromSet = function (thingSet, setParams) {
  var b2Mat22              = box2d.b2Mat22,
      b2MulMV              = box2d.b2MulMV;

  var setParams = BIB.getDefaultParams(setParams);
  var rotation = b2Mat22.FromAngleRadians(setParams.angle);

  thingSet.forEach(function (descriptor) {
    var params = BIB.getDefaultParams(descriptor.params);
    params.position.x *= setParams.scale.x;
    params.position.y *= setParams.scale.y;
    b2MulMV(rotation, params.position, params.position);
    params.position.SelfAdd(setParams.position);

    params.angle += setParams.angle;
    params.scale.x *= setParams.scale.x;
    params.scale.y *= setParams.scale.y;
    params.depth += setParams.depth;
    params.velocity.SelfAdd(setParams.velocity);
    params.animation = setParams.animation;
    params.alpha *= setParams.alpha;
    this.newThing(descriptor.kind, params);
  }, this);
};

BIB.Thing = function (kind, index, body, actor, depth, animationName,
                      skeleton) {
  // The Kind that this Thing is an instance of.
  this.kind = kind;
  // This Things index in kind.things. Volatile, read-only.
  this.index = index;
  // The b2Body used for simulation.
  this.body = body;
  // The IvanK actor that renders the sprite.
  this.actor = actor;
  // The layer (z-depth) of this Thing. Read-only.
  this.depth = depth;
  // The current animation. Set using setAnimation().
  this.animation = animationName;
  // Whether this Thing has been destroyed.
  this.destroyed = false;
  // This object's skeleton Sprite.
  this.skeleton = skeleton;
};

BIB.Thing.prototype.setAnimation = function (animationName) {
  if (animationName == this.animation) {
    return;
  }

  if (!animationName) {
    this.animation = '';
    this.actor.setAnimation(null);
    return;
  }

  this.animation = animationName;
  var world = this.kind.world;
  var animation = world.allAnimations[animationName];
  this.actor.setAnimation(animation);
}

BIB.Thing.prototype.destroy = function () {
  var world = this.kind.world;
  if (!this.destroyed) {
    this.destroyed = true;

    // Remove actor.
    var layer = world.getLayer(this.depth);
    layer.removeChild(this.actor);
    this.actor.thing = null;
    this.actor = null;

    // Remove skeleton.
    world.skeletonLayer.removeChild(this.skeleton);
    this.skeleton = null;

    // Remove body.
    world.boxWorld.DestroyBody(this.body);
    this.body.SetUserData(null);
    this.body = null;

    // Move last thing into this index;
    var lastIndex = this.kind.nextThingIndex - 1;
    var lastThing = this.kind.things[lastIndex];
    this.kind.things[this.index] = lastThing;
    lastThing.index = this.index;
    this.kind.things[lastIndex] = null;
    this.kind.nextThingIndex--;
    this.index = undefined;
  }
};
BIB.validateArray = function (array, output) {
  if (!Array.isArray(array)) {
    console.log(output + ' should be contained in an array.');
  }
};

BIB.validateString = function (string, output) {
  if (typeof string != 'string') {
    console.log(output + ' should be a string.');
  }
};

BIB.validateObject = function (object, output) {
  if (typeof object != 'object') {
    console.log(output + ' should be an object.');
  }
};

BIB.validateAttributes = function (object, attributes) {
  for (var a in object) {
    if (attributes.indexOf(a) == -1) {
      console.log('Unknown attribute: ' + a);
    }
  }
};

BIB.validateNumber = function (number, output) {
  if (typeof number != 'number') {
    console.log(output + ' should be a number.');
  }
};

BIB.validateBoolean = function (number, output) {
  if (typeof number != 'boolean') {
    console.log(output + ' should be a boolean.');
  }
};

BIB.validateVector = function (vector, output) {
  var	b2Vec2		      = box2d.b2Vec2;

  if (!(Array.isArray(vector) && vector.length == 2) &&
      !(vector instanceof b2Vec2)) {
    console.log(output + ' should be a vector.');
  }
};

BIB.optionallyValidate = function (func, object, param2) {
  if (object !== undefined) {
    func(object, param2);
  }
};

BIB.validateArrayOfStrings = function (array, output) {
  BIB.validateArray(array, output);
  array.forEach(function (element) {
    BIB.validateString(element, output);
  });
};

BIB.validateArrayOfVectors = function (array, output) {
  BIB.validateArray(array, output);
  array.forEach(function (element) {
    BIB.validateVector(element, output);
  });
};

BIB.validateAnimationDescriptors = function (animations) {
  var optional = BIB.optionallyValidate;

  if (!animations) {
    return;
  }

  var animationAttributes =
      ['name', 'file', 'size', 'offset', 'alpha', 'speed', 'gridDimensions',
       'frameCount', 'frameOffset', 'blendMode'];

  BIB.validateArray(animations, 'Animation descriptors');
  animations.forEach(function (animation) {
    BIB.validateObject(animation, 'Animation descriptor');
    BIB.validateAttributes(animation, animationAttributes);
    BIB.validateString(animation.name, 'Animation name');
    BIB.validateString(animation.file, 'Animation file');
    optional(BIB.validateVector, animation.size, 'Animation size');
    optional(BIB.validateVector, animation.offset, 'Animation offset');
    optional(BIB.validateNumber, animation.alpha, 'Animation alpha');
    optional(BIB.validateNumber, animation.speed, 'Animation speed');
    optional(BIB.validateVector,
             animation.gridDimensions,
             'Animation grid dimensions');
    optional(BIB.validateNumber, animation.frameCount, 'Animation frame count');
    optional(BIB.validateNumber,
             animation.frameOffset,
             'Animation frame offset');
    optional(BIB.validateString,
             animation.blendMode,
             'Animation blend mode');
  });
};

BIB.validateFixtureDescriptors = function (fixtures) {
  var	b2Vec2		      = box2d.b2Vec2;

  var optional = BIB.optionallyValidate;

  var fixtureAttributes =
      ['shapeType', 'shapeData', 'properties', 'collisionFilter'];

  BIB.validateArray(fixtures, 'Fixture descriptors fixtures');
  fixtures.forEach(function (fixture) {
    BIB.validateObject(fixture, 'Fixture descriptor');
    BIB.validateAttributes(fixture, fixtureAttributes);

    optional(BIB.validateString, fixtures.shapeType, 'Fixture\'s shape type');
    if (fixtures.shapeData !== undefined) {
      var type = fixtures.shapeType;
      var data = fixtures.shapeData;
      if (type == 'circle') {
        BIB.validateNumber(data, '\'circle\' shape type');
      } else if (type == 'box' &&
                 typeof data != 'number' &&
                 !((Array.isArray(data) && data.length == 2) ||
                   (data instanceof b2Vec2))) {
        console.log('\'box\' shape type must be number or vector.');
      } else if (type == 'polygon' ||
                 type == 'chain' ||
                 type == 'loop') {
        BIB.validateArrayOfVectors(
            data, '\'polygon\', \'chain\', or \'loop\' shape data');
      } else {
        console.log('Unknown shape type: ' + type);
      }
    }

    if (fixture.properties !== undefined) {
      var p = fixture.properties;
      BIB.validateObject(p, 'Fixture properties');
      BIB.validateAttributes(
          p,
          ['density', 'friction', 'restitution', 'isSensor']);
      optional(BIB.validateNumber, p.density, 'Fixture\'s density');
      optional(BIB.validateNumber, p.friction, 'Fixture\'s friction');
      optional(BIB.validateNumber, p.restitution, 'Fixture\'s restitution');
      optional(BIB.validateBoolean, p.isSensor, 'Fixture isSensor');
    }

    if (fixture.collisionFilter != undefined) {
      var cf = fixture.collisionFilter;
      BIB.validateObject(cf, 'Collision filter');
      BIB.validateAttributes(cf,
          ['collisionCategories', 'onlyCollidesWith', 'doesNotCollideWith']);
      optional(BIB.validateArrayOfStrings,
               cf.collisionCategories,
               'Fixture\'s collision categories');
      optional(BIB.validateArrayOfStrings,
               cf.onlyCollidesWith,
               'onlyCollidesWith');
      optional(BIB.validateArrayOfStrings,
               cf.doesNotCollideWith,
               'doesNotCollideWith');
    }
  });
};

BIB.validateKindDescriptors = function (kinds) {
  var optional = BIB.optionallyValidate;

  if (!kinds) {
    return;
  }

  var kindAttributes =
      ['name', 'animation', 'animationOffset', 'fixtures', 'movementType',
       'linearDamping', 'angularDamping', 'fixedRotation'];

  BIB.validateArray(kinds, 'Kind descriptors');
  kinds.forEach(function (kind) {
    BIB.validateObject(kind, 'Kind descriptor');
    BIB.validateAttributes(kind, kindAttributes);
    BIB.validateString(kind.name, 'Kind name');
    optional(BIB.validateString, kind.animation, 'Kind\'s animation');
    optional(BIB.validateVector,
             kind.animationOffset,
             'Kind\'s animation offset');

    optional(BIB.validateFixtureDescriptors, kind.fixtures);

    var movementTypes = ['dynamic', 'static', 'kinematic'];
    if (kind.movementType !== undefined &&
        movementTypes.indexOf(kind.movementType) == -1) {
      console.log('Kind\'s movement type must be one of ' +
                  '\'dynamic\', \'static\', or \'kinematic\'');
    }

    optional(BIB.validateNumber, kind.linearDamping, 'Kind\'s linear damping');
    optional(BIB.validateNumber, kind.angularDamping, 'Kind\'s angular damping');
    if (kind.fixedRotation !== undefined) {
      if (typeof kind.fixedRotation != 'boolean') {
        console.log('Kind\'s rotation fixed-ness should be a boolean.');
      }
    }
  });
};

BIB.validateThingDescriptors = function (things) {
  var optional = BIB.optionallyValidate;

  things.forEach(function (thing) {
    BIB.validateObject(thing, 'Thing descriptor');
    BIB.validateAttributes(thing, ['kind', 'params']);
    BIB.validateString(thing.kind, 'Thing\'s Kind');
    if (thing.params) {
      BIB.validateObject(thing.params, 'Thing\'s params');
      BIB.validateAttributes(thing.params, Object.keys(BIB.getDefaultParams()));
      optional(BIB.validateVector, thing.position, 'Things\'s position');
      optional(BIB.validateNumber, thing.angle, 'Things\'s angle');
      optional(BIB.validateVector, thing.scale, 'Things\'s scale');
      optional(BIB.validateNumber, thing.alpha, 'Things\'s alpha');
      optional(BIB.validateNumber, thing.depth, 'Things\'s depth');
      optional(BIB.validateVector, thing.velocity, 'Things\'s velocity');
      optional(BIB.validateString, thing.animation, 'Things\'s animation');
    }
  });
};

BIB.validateSetDescriptors = function (sets) {
  if (!sets) {
    return;
  }

  BIB.validateArray(sets, 'Set descriptors');
  sets.forEach(function (currentSet) {
    BIB.validateObject(currentSet, 'Set descriptor');
    BIB.validateAttributes(currentSet, ['name', 'things']);
    BIB.validateString(currentSet.name, 'Set name');
    BIB.validateArray(currentSet.things, 'List of Things in a Set');
    BIB.validateThingDescriptors(currentSet.things);
  });
};
