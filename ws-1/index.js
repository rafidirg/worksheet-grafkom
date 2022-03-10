"use strict";

const canvas = document.getElementById("gl-canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  alert("WebGL 2.0 isn't available");
}

const maxNumTriangle = 200;
const maxNumPosition = 3 * maxNumTriangle;

var shapeIndex = 0;
var colorIndex = 0;
var lineIndex = 0;
var drawMode;
var incrPos;
var index = 0;
var cntPos = 1;

let offsetY = canvas.getBoundingClientRect().top;
let offsetX = canvas.getBoundingClientRect().left;

// Color
var colors = [
  vec4(0.0, 0.0, 0.0, 1.0), // black
  vec4(1.0, 0.0, 0.0, 1.0), // red
  vec4(1.0, 0.5, 0.0, 1.0), // orange
  vec4(1.0, 1.0, 0.0, 1.0), // yellow
  vec4(0.0, 1.0, 0.0, 1.0), // green
  vec4(0.0, 1.0, 1.0, 1.0), // cyan
  vec4(0.0, 0.0, 1.0, 1.0), // blue
  vec4(1.0, 0.0, 1.0, 1.0), // magenta
];

var verticeList = [];

init();

const clearBtn = document.getElementById("clearDrawing");
clearBtn.onclick = function () {
  index = 0;
  shapeIndex = 0;
  colorIndex = 0;
  lineIndex = 0;
  index = 0;
  cntPos = 1;
  verticeList = [];
};

// Init Function
function init() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.8, 0.8, 0.8, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Initialize program
  const program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Create position buffer
  const vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumPosition, gl.STATIC_DRAW);
  // Get memory location of variable aPosition
  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  // Create color buffer
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumPosition, gl.STATIC_DRAW);
  // Get memory location of variable aColor
  var colorLoc = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  // get the component by Id
  const shapeMenu = document.getElementById("shapeMenu");
  const colorMenu = document.getElementById("colorMenu");

  // get component's index
  shapeMenu.addEventListener("click", () => {
    shapeIndex = shapeMenu.selectedIndex;
  });
  colorMenu.addEventListener("click", () => {
    colorIndex = colorMenu.selectedIndex;
  });

  // create event listener when mouse down
  canvas.addEventListener("mousedown", (event) => {
    if (shapeIndex === 0) drawLine(event, vBuffer, cBuffer);
  });
  render();
}

// Draw Line
function drawLine(event, vBuffer, cBuffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  drawMode = gl.LINES;
  incrPos = 2;
  if (cntPos === 1) {
    verticeList[0] = vec2(
      (2 * (event.clientX - offsetX)) / canvas.width - 1,
      (2 * (canvas.height - (event.clientY - offsetY))) / canvas.height - 1
    );
    cntPos += 1;
  } else {
    verticeList[1] = vec2(
      (2 * (event.clientX - offsetX)) / canvas.width - 1,
      (2 * (canvas.height - (event.clientY - offsetY))) / canvas.height - 1
    );
    for (var i = 0; i < 2; i++) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        8 * (index + i),
        flatten(verticeList[i])
      );
    }
    index += 2;

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    var tt = colors[colorIndex];
    for (var i = 0; i < 2; i++) {
      gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index - 2 + i), flatten(tt));
    }
    cntPos = 1;
  }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (var i = 0; i < index; i += incrPos) {
    gl.drawArrays(drawMode, i, incrPos);
  }
  requestAnimationFrame(render);
}
