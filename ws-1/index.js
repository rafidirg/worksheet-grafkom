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

var verticeList = [];
var objectList = [];

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
  vec4(1.0, 1.0, 1.0, 1.0), // white
];

init();

const clearBtn = document.getElementById("clearDrawing");
clearBtn.onclick = function () {
  index = 0;
  cntPos = 1;
  objectList = [];
  verticeList = [];
};

function getMousePos(event) {
  return vec2(
    (2 * (event.clientX - offsetX)) / canvas.width - 1,
    (2 * (canvas.height - (event.clientY - offsetY))) / canvas.height - 1
  );
}

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

  // Create event list

  // create event listener when mouse down
  canvas.addEventListener("mousedown", (event) => {
    if (shapeIndex === 0) drawLine(event, vBuffer, cBuffer);
    else if (shapeIndex === 1) drawTriangle(event, vBuffer, cBuffer);
    else if (shapeIndex === 2) drawSquare(event, vBuffer, cBuffer);
  });
  render();
}

function drawTriangle(event, vBuffer, cBuffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  drawMode = gl.TRIANGLE_FAN;
  incrPos = 3;
  if (cntPos === 1) {
    verticeList[0] = getMousePos(event);
    cntPos++;
  } else if (cntPos === 2) {
    verticeList[1] = getMousePos(event);
    cntPos++;
  } else {
    verticeList[2] = getMousePos(event);
    for (var i = 0; i < incrPos; i++) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        8 * (index + i),
        flatten(verticeList[i])
      );
    }
    index += incrPos;

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    var tt = colors[colorIndex];
    for (var i = 0; i < incrPos; i++) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        16 * (index - incrPos + i),
        flatten(tt)
      );
    }
    cntPos = 1;
    objectList.push({ drawMode: drawMode, incrPos: incrPos });
  }
}

// Draw square
function drawSquare(event, vBuffer, cBuffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  drawMode = gl.TRIANGLE_FAN;
  incrPos = 4;
  if (cntPos === 1) {
    verticeList[0] = getMousePos(event);
    cntPos += 1;
  } else {
    verticeList[2] = getMousePos(event);
    verticeList[1] = vec2(verticeList[0][0], verticeList[2][1]);
    verticeList[3] = vec2(verticeList[2][0], verticeList[0][1]);
    for (var i = 0; i < incrPos; i++) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        8 * (index + i),
        flatten(verticeList[i])
      );
    }
    index += incrPos;

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    var tt = colors[colorIndex];
    for (var i = 0; i < incrPos; i++) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        16 * (index - incrPos + i),
        flatten(tt)
      );
    }
    cntPos = 1;
    objectList.push({ drawMode: drawMode, incrPos: incrPos });
  }
}

// Draw Line
function drawLine(event, vBuffer, cBuffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  drawMode = gl.LINES;
  incrPos = 2;
  if (cntPos === 1) {
    verticeList[0] = getMousePos(event);
    cntPos += 1;
  } else {
    verticeList[1] = getMousePos(event);
    for (var i = 0; i < incrPos; i++) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        8 * (index + i),
        flatten(verticeList[i])
      );
    }
    index += incrPos;

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    var tt = colors[colorIndex];
    for (var i = 0; i < incrPos; i++) {
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        16 * (index - incrPos + i),
        flatten(tt)
      );
    }
    cntPos = 1;
    objectList.push({ drawMode: drawMode, incrPos: incrPos });
  }
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  // for (var i = 0; i < index; i += incrPos) {
  //   gl.drawArrays(drawMode, i, incrPos);
  // }
  var ii = 0;
  for (var i = 0; i < objectList.length; i++) {
    gl.drawArrays(objectList[i].drawMode, ii, objectList[i].incrPos);
    ii += objectList[i].incrPos;
  }
  requestAnimationFrame(render);
}
