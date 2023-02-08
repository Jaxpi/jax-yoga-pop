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

};
