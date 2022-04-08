"use strict";

var gl;

var theta = 0.0;
var thetaLoc;
var colorLoc;
var speed = 100;
var direction = true;
var ver_len;

init();

function init() {
  var canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  //
  //  Configure WebGL
  //
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  //  Load shaders and initialize attribute buffers

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var vertices = [
    vec2(-0.5, -0.1),
    vec2(-0.5, 0.1),
    vec2(0.2, -0.1),
    vec2(0.2, 0.1),
    vec2(0.5, 0.0),
    vec2(0.0, 0.3),
    vec2(0.5, 0.0),
    vec2(0.2, 0.0),
    vec2(0.0, -0.3),
  ];

  ver_len = vertices.length;

  // Load the data into the GPU

  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  // Associate out shader variables with our data buffer

  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  thetaLoc = gl.getUniformLocation(program, "uTheta");
  colorLoc = gl.getUniformLocation(program, "uColor");

  // Initialize Color
  gl.uniform4f(colorLoc, Math.random(), Math.random(), Math.random(), 1.0);

  // Initialize event handlers

  document.getElementById("slider").onchange = function (event) {
    speed = 100 - event.target.value;
  };
  document.getElementById("Direction").onclick = function (event) {
    direction = !direction;
  };

  document.getElementById("Controls").onclick = function (event) {
    switch (event.target.index) {
      case 0:
        direction = !direction;
        break;

      case 1:
        speed /= 2.0;
        break;

      case 2:
        speed *= 2.0;
        break;
    }
  };

  window.onkeydown = function (event) {
    var key = String.fromCharCode(event.keyCode);
    switch (key) {
      case "1":
        direction = !direction;
        break;

      case "2":
        speed /= 2.0;
        break;

      case "3":
        speed *= 2.0;
        break;
    }
  };

  render();
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  theta += direction ? 0.1 : -0.1;
  if (theta >= Math.PI * 2 || theta <= -(Math.PI * 2)) {
    theta = 0;
    gl.uniform4f(colorLoc, Math.random(), Math.random(), Math.random(), 1.0);
  }

  gl.uniform1f(thetaLoc, theta);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, ver_len);

  setTimeout(function () {
    requestAnimationFrame(render);
  }, speed);
}
