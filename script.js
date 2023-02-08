window.onload = function () {
  var canvas = document.getElementById("viewport");
  var context = canvas.getContext("2d");
  var lastframe = 0;
  var initialized = false;

  var level = {
    x: 4,
    y: 83,
    width: 0,
    height: 0,
    columns: 15,
    rows: 14,
    tilewidth: 40,
    tileheight: 40,
    rowheight: 34,
    radius: 20,
    tiles: [],
  };

  var Tile = function (x, y, type, shift) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.removed = false;
    this.shift = shift;
    this.velocity = 0;
    this.alpha = 1;
    this.processed = false;
  };

  var player = {
    x: 0,
    y: 0,
    angle: 0,
    tiletype: 0,
    bubble: {
      x: 0,
      y: 0,
      angle: 0,
      speed: 1000,
      dropspeed: 900,
      tiletype: 0,
      visible: false,
    },
    nextbubble: {
      x: 0,
      y: 0,
      tiletype: 0,
    },
  };

  var neighborsoffsets = [
    [
      [1, 0],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, -1],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, -1],
    ],
  ];
  var bubblecolors = 7;
  var gamestates = {
    init: 0,
    ready: 1,
    shootbubble: 2,
    removecluster: 3,
    gameover: 4,
  };
  var gamestate = gamestates.init;
  var score = 0;
  var turncounter = 0;
  var rowoffset = 0;
  var animationstate = 0;
  var animationtime = 0;
  var showcluster = false;
  var cluster = [];
  var floatingclusters = [];
  var images = [];
  var bubbleimage;
  var loadcount = 0;
  var loadtotal = 0;
  var preloaded = false;

  function loadImages(imagefiles) {
    loadcount = 0;
    loadtotal = imagefiles.length;
    preloaded = false;

    var loadedimages = [];
    for (var i = 0; i < imagefiles.length; i++) {
      var image = new Image();
      image.onload = function () {
        loadcount++;
        if (loadcount == loadtotal) {
          preloaded = true;
        }
      };
      image.src = imagefiles[i];
      loadedimages[i] = image;
    }
    return loadedimages;
  }

  // GAME INITIALIZATION FUNCTION
  function init() {
    images = loadImages(["./assets/imgArrYoga.png"]);
    bubbleimage = images[0];

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);

    for (var i = 0; i < level.columns; i++) {
      level.tiles[i] = [];
      for (var j = 0; j < level.rows; j++) {
        level.tiles[i][j] = new Tile(i, j, 0, 0);
      }
    }
    level.width = level.columns * level.tilewidth + level.tilewidth / 2;
    level.height = (level.rows - 1) * level.rowheight + level.tileheight;

    player.x = level.x + level.width / 2 - level.tilewidth / 2;
    player.y = level.y + level.height;
    player.angle = 90;
    player.tiletype = 0;
    player.nextbubble.x = player.x - 2 * level.tilewidth;
    player.nextbubble.y = player.y;

    newGame();
    main(0);
  }

   function main(tframe) {
    window.requestAnimationFrame(main);

    if (!initialized) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawFrame();

      var loadpercentage = loadcount / loadtotal;
      context.strokeStyle = "#ff8080";
      context.lineWidth = 3;
      context.strokeRect(18.5, 0.5 + canvas.height - 51, canvas.width - 37, 32);
      context.fillStyle = "#ff8080";
      context.fillRect(
        18.5,
        0.5 + canvas.height - 51,
        loadpercentage * (canvas.width - 37),
        32
      );

      var loadtext = "Loaded " + loadcount + "/" + loadtotal + " images";
      context.fillStyle = "#000000";
      context.font = "16px Verdana";
      context.fillText(loadtext, 18, 0.5 + canvas.height - 63);

      if (preloaded) {
        setTimeout(function () {
          initialized = true;
        }, 1000);
      }
    } else {
      update(tframe);
      render();
    }
  }

  function update(tframe) {
    var dt = (tframe - lastframe) / 1000;
    lastframe = tframe;

    if (gamestate == gamestates.ready) {
    } else if (gamestate == gamestates.shootbubble) {
      stateShootBubble(dt);
    } else if (gamestate == gamestates.removecluster) {
      stateRemoveCluster(dt);
    }
  }

  function setGameState(newgamestate) {
    gamestate = newgamestate;
    animationstate = 0;
    animationtime = 0;
  }

  function stateShootBubble(dt) {
    player.bubble.x +=
      dt * player.bubble.speed * Math.cos(degToRad(player.bubble.angle));
    player.bubble.y +=
      dt * player.bubble.speed * -1 * Math.sin(degToRad(player.bubble.angle));

    if (player.bubble.x <= level.x) {
      player.bubble.angle = 180 - player.bubble.angle;
      player.bubble.x = level.x;
    } else if (player.bubble.x + level.tilewidth >= level.x + level.width) {
      player.bubble.angle = 180 - player.bubble.angle;
      player.bubble.x = level.x + level.width - level.tilewidth;
    }

    if (player.bubble.y <= level.y) {
      player.bubble.y = level.y;
      snapBubble();
      return;
    }

    for (var i = 0; i < level.columns; i++) {
      for (var j = 0; j < level.rows; j++) {
        var tile = level.tiles[i][j];

        if (tile.type < 0) {
          continue;
        }

        var coord = getTileCoordinate(i, j);
        if (
          circleIntersection(
            player.bubble.x + level.tilewidth / 2,
            player.bubble.y + level.tileheight / 2,
            level.radius,
            coord.tilex + level.tilewidth / 2,
            coord.tiley + level.tileheight / 2,
            level.radius
          )
        ) {
          snapBubble();
          return;
        }
      }
    }
  }

  function stateRemoveCluster(dt) {
    if (animationstate == 0) {
      resetRemoved();

      for (var i = 0; i < cluster.length; i++) {
        cluster[i].removed = true;
      }

      score += cluster.length * 100;

      floatingclusters = findFloatingClusters();

      if (floatingclusters.length > 0) {
        for (var i = 0; i < floatingclusters.length; i++) {
          for (var j = 0; j < floatingclusters[i].length; j++) {
            var tile = floatingclusters[i][j];
            tile.shift = 0;
            tile.shift = 1;
            tile.velocity = player.bubble.dropspeed;

            score += 100;
          }
        }
      }

      animationstate = 1;
    }

    if (animationstate == 1) {
      var tilesleft = false;
      for (var i = 0; i < cluster.length; i++) {
        var tile = cluster[i];

        if (tile.type >= 0) {
          tilesleft = true;

          tile.alpha -= dt * 15;
          if (tile.alpha < 0) {
            tile.alpha = 0;
          }

          if (tile.alpha == 0) {
            tile.type = -1;
            tile.alpha = 1;
          }
        }
      }

      for (var i = 0; i < floatingclusters.length; i++) {
        for (var j = 0; j < floatingclusters[i].length; j++) {
          var tile = floatingclusters[i][j];

          if (tile.type >= 0) {
            tilesleft = true;

            tile.velocity += dt * 700;
            tile.shift += dt * tile.velocity;

            tile.alpha -= dt * 8;
            if (tile.alpha < 0) {
              tile.alpha = 0;
            }

            if (
              tile.alpha == 0 ||
              tile.y * level.rowheight + tile.shift >
                (level.rows - 1) * level.rowheight + level.tileheight
            ) {
              tile.type = -1;
              tile.shift = 0;
              tile.alpha = 1;
            }
          }
        }
      }

      if (!tilesleft) {
        nextBubble();

        var tilefound = false;
        for (var i = 0; i < level.columns; i++) {
          for (var j = 0; j < level.rows; j++) {
            if (level.tiles[i][j].type != -1) {
              tilefound = true;
              break;
            }
          }
        }

        if (tilefound) {
          setGameState(gamestates.ready);
        } else {
          setGameState(gamestates.gameover);
        }
      }
    }
  }

  function snapBubble() {
    var centerx = player.bubble.x + level.tilewidth / 2;
    var centery = player.bubble.y + level.tileheight / 2;
    var gridpos = getGridPosition(centerx, centery);

    if (gridpos.x < 0) {
      gridpos.x = 0;
    }

    if (gridpos.x >= level.columns) {
      gridpos.x = level.columns - 1;
    }

    if (gridpos.y < 0) {
      gridpos.y = 0;
    }

    if (gridpos.y >= level.rows) {
      gridpos.y = level.rows - 1;
    }

    var addtile = false;
    if (level.tiles[gridpos.x][gridpos.y].type != -1) {
      for (var newrow = gridpos.y + 1; newrow < level.rows; newrow++) {
        if (level.tiles[gridpos.x][newrow].type == -1) {
          gridpos.y = newrow;
          addtile = true;
          break;
        }
      }
    } else {
      addtile = true;
    }

    if (addtile) {
      player.bubble.visible = false;

      level.tiles[gridpos.x][gridpos.y].type = player.bubble.tiletype;

      if (checkGameOver()) {
        return;
      }

      cluster = findCluster(gridpos.x, gridpos.y, true, true, false);

      if (cluster.length >= 3) {
        setGameState(gamestates.removecluster);
        return;
      }
    }

    turncounter++;
    if (turncounter >= 5) {
      addBubbles();
      turncounter = 0;
      rowoffset = (rowoffset + 1) % 2;

      if (checkGameOver()) {
        return;
      }
    }

    nextBubble();
    setGameState(gamestates.ready);
  }

  function checkGameOver() {
    for (var i = 0; i < level.columns; i++) {
      if (level.tiles[i][level.rows - 1].type != -1) {
        nextBubble();
        setGameState(gamestates.gameover);
        return true;
      }
    }

    return false;
  }

  function addBubbles() {
    for (var i = 0; i < level.columns; i++) {
      for (var j = 0; j < level.rows - 1; j++) {
        level.tiles[i][level.rows - 1 - j].type =
          level.tiles[i][level.rows - 1 - j - 1].type;
      }
    }

    for (var i = 0; i < level.columns; i++) {
      level.tiles[i][0].type = getExistingColor();
    }
  }

  function findColors() {
    var foundcolors = [];
    var colortable = [];
    for (var i = 0; i < bubblecolors; i++) {
      colortable.push(false);
    }

    for (var i = 0; i < level.columns; i++) {
      for (var j = 0; j < level.rows; j++) {
        var tile = level.tiles[i][j];
        if (tile.type >= 0) {
          if (!colortable[tile.type]) {
            colortable[tile.type] = true;
            foundcolors.push(tile.type);
          }
        }
      }
    }

    return foundcolors;
  }

  function findCluster(tx, ty, matchtype, reset, skipremoved) {
    if (reset) {
      resetProcessed();
    }

    var targettile = level.tiles[tx][ty];

    var toprocess = [targettile];
    targettile.processed = true;
    var foundcluster = [];

    while (toprocess.length > 0) {
      var currenttile = toprocess.pop();

      if (currenttile.type == -1) {
        continue;
      }

      if (skipremoved && currenttile.removed) {
        continue;
      }

      if (!matchtype || currenttile.type == targettile.type) {
        foundcluster.push(currenttile);

        var neighbors = getNeighbors(currenttile);

        for (var i = 0; i < neighbors.length; i++) {
          if (!neighbors[i].processed) {
            toprocess.push(neighbors[i]);
            neighbors[i].processed = true;
          }
        }
      }
    }
    return foundcluster;
  }

  function findFloatingClusters() {
    resetProcessed();

    var foundclusters = [];

    for (var i = 0; i < level.columns; i++) {
      for (var j = 0; j < level.rows; j++) {
        var tile = level.tiles[i][j];
        if (!tile.processed) {
          var foundcluster = findCluster(i, j, false, false, true);

          if (foundcluster.length <= 0) {
            continue;
          }

          var floating = true;
          for (var k = 0; k < foundcluster.length; k++) {
            if (foundcluster[k].y == 0) {
              floating = false;
              break;
            }
          }

          if (floating) {
            foundclusters.push(foundcluster);
          }
        }
      }
    }

    return foundclusters;
  }

  function resetProcessed() {
    for (var i = 0; i < level.columns; i++) {
      for (var j = 0; j < level.rows; j++) {
        level.tiles[i][j].processed = false;
      }
    }
  }

  function resetRemoved() {
    for (var i = 0; i < level.columns; i++) {
      for (var j = 0; j < level.rows; j++) {
        level.tiles[i][j].removed = false;
      }
    }
  }

  function getNeighbors(tile) {
    var tilerow = (tile.y + rowoffset) % 2; // Even or odd row
    var neighbors = [];

    var n = neighborsoffsets[tilerow];

    for (var i = 0; i < n.length; i++) {
      var nx = tile.x + n[i][0];
      var ny = tile.y + n[i][1];

      if (nx >= 0 && nx < level.columns && ny >= 0 && ny < level.rows) {
        neighbors.push(level.tiles[nx][ny]);
      }
    }

    return neighbors;
  }

  function drawCenterText(text, x, y, width) {
    var textdim = context.measureText(text);
    context.fillText(text, x + (width - textdim.width) / 2, y);
  }

};
