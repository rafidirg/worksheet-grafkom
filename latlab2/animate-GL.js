"use strict";

var canvas;
var gl;

var primitiveType;
var offset = 0;
var count = 12;

var colorUniformLocation;
var translation = [200, 200]; //top-left of rectangle
var angle = 0;
var angleInRadians = 0;
var scale = [1.0, 1.0, 1.0]; //default scale
var matrix;
var matrixLocation;
var translationMatrix;
var rotationMatrix;
var scaleMatrix;
var moveOriginMatrix; //move origin to 'center' of the letter as center of rotation
var projectionMatrix;

var movement = 1;
var currentposition = 0;
var scalefactor = 0.005;
var currentscale = 0.005;
var middlewidth = 0;

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2.0 isn't available");

  //
  //  Configure WebGL
  //
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Load the data into the GPU
  var letterbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, letterbuffer);

  // Associate out shader variables with our data buffer

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  colorUniformLocation = gl.getUniformLocation(program, "u_color");

  matrixLocation = gl.getUniformLocation(program, "u_matrix");
  middlewidth = Math.floor(gl.canvas.width / 2);

  primitiveType = gl.TRIANGLES;
  render(); //default render
};

function render() {
  currentposition += movement;
  currentscale += scalefactor;

  if (currentposition > middlewidth) {
    currentposition = middlewidth;
    movement = -movement;
  }
  if (currentposition < 0) {
    currentposition = 0;
    movement = -movement;
  }

  if (currentscale > 2) {
    currentscale = 2.0;
    scalefactor = -scalefactor;
  }

  if (currentscale < 0.005) {
    currentscale = 0.005;
    scalefactor = -scalefactor;
  }

  angle += 2.0;

  gl.clear(gl.COLOR_BUFFER_BIT);

  drawletterI();
  drawletterD();

  // requestAnimationFrame(render); //refresh
}

function drawletterI() {
  translation = [middlewidth - 130, - gl.canvas.height / 2, 600];

  angleInRadians = 360 - (angle * Math.PI) / 180; //rotating counter clockwise

  count = setGeometry(gl, 1).length;

  matrix = m4.identity();
  projectionMatrix = m4.projection(gl.canvas.width, gl.canvas.height, 2000);
  translationMatrix = m4.translation(
    translation[0] - currentposition,
    translation[1] - currentposition,
    translation[2] - currentposition
  );
  rotationMatrix = m4.rotation(angleInRadians);
  scaleMatrix = m4.scaling(
    scale[0] + currentscale,
    scale[1] + currentscale,
    scale[2] + currentscale
  );
  moveOriginMatrix = m4.translation(0, -65, -90);

  // Multiply the matrices.
  matrix = m4.multiply(projectionMatrix, translationMatrix);
  matrix = m4.multiply(matrix, rotationMatrix);
  matrix = m4.multiply(matrix, scaleMatrix);
  matrix = m4.multiply(matrix, moveOriginMatrix);

  //set color
  gl.uniform4f(colorUniformLocation, 0, 0, 1, 1);

  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  //gl.clear( gl.COLOR_BUFFER_BIT );
  gl.drawArrays(primitiveType, offset, count/3);
}

function drawletterD() {
  count = setGeometry(gl, 2).length;

  translation = [middlewidth + 100, - gl.canvas.height / 2 - 90, 300];
  angleInRadians = (angle * Math.PI) / 180; //rotating counter clockwise

  matrix = m4.identity();
  projectionMatrix = m4.projection(gl.canvas.width, gl.canvas.height, 2000);
  translationMatrix = m4.translation(
    translation[0] - currentposition,
    translation[1] - currentposition,
    translation[2] - currentposition
  );
  rotationMatrix = m4.rotation(angleInRadians);
  scaleMatrix = m4.scaling(
    scale[0] + currentscale,
    scale[1] + currentscale,
    scale[2] + currentscale
  );
  moveOriginMatrix = m4.translation(0, 65, 90);

  // Multiply the matrices.
  matrix = m4.multiply(projectionMatrix, translationMatrix);
  matrix = m4.multiply(matrix, rotationMatrix);
  matrix = m4.multiply(matrix, scaleMatrix);
  matrix = m4.multiply(matrix, moveOriginMatrix);

  //set color
  gl.uniform4f(colorUniformLocation, 1.0, 0, 0, 1);

  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  //gl.clear( gl.COLOR_BUFFER_BIT );
  gl.drawArrays(primitiveType, offset, count);
}

const m4 = {
  identity: function () {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
},

  projection: function (width, height, depth) {
    return [
        2 / width, 0, 0, 0,
        0, 2 / height, 0, 0,
        0, 0, 2 / depth, 0,
        -1, 1, -1, 1,
    ];
},


  translation: function (tx, ty, tz) {
    return [1, 0, 0, 0, 
            0, 1, 0, 0, 
            0, 0, 1, 0, 
            tx, ty, tz, 1
        ];
  },

  rotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    var matx = [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1,
    ]
    var maty = [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1,
    ]
    var matz = [
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]
    let res = m4.multiply(matx, maty)
    res = m4.multiply(res, matz)
    return res
},

  scaling: function (sx, sy, sz) {
    return [sx, 0, 0, 0, 
            0, sy, 0, 0, 
            0, 0, sz, 0, 
            0, 0, 0, 1
        ];
  },

  multiply: function (a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b31 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },
};

function drawPointTo3DCube(vert) {
  var triangleVert = [];

  let quads = [
    [1, 0, 3, 2],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
    [6, 5, 1, 2],
    [4, 5, 6, 7],
    [5, 4, 0, 1],
  ];

  for (let q of quads) {
    let a = q[0];
    let b = q[1];
    let c = q[2];
    let d = q[3];

    let indices = [a, b, c, a, c, d];

    for (var indice of indices) {
      let tesselatedVertices = vert[indice];
      for (let vertex of tesselatedVertices) {
        triangleVert.push(vertex);
      }
    }
  }
  return triangleVert;
}

function setGeometry(gl, shape) {
  switch (shape) {
    case 1:
      const points_i = [
        [0, 0, 30],
        [0, 150, 30],
        [30, 150, 30],
        [30, 0, 30],
        [0, 0, 0],
        [0, 150, 0],
        [30, 150, 0],
        [30, 0, 0],
      ];

	  const vertices_i = drawPointTo3DCube(points_i)

    for( var ii = 0; ii < vertices_i.length; ii += 3 ) {
      console.log (`${vertices_i[ii]}, ${vertices_i[ii+1]}, ${vertices_i[ii+2]}`)
    }

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices_i),
        gl.STATIC_DRAW
      );

      console.log(vertices_i)

      return vertices_i;

	  
    case 2: // Fill the buffer with the values that define a letter 'L'. 
      const points1 = [
        [0, 0, 30],
        [0, 150, 30],
        [30, 150, 30],
        [30, 0, 30],
        [0, 0, 0],
        [0, 150, 0],
        [30, 150, 0],
        [30, 0, 0],
      ];
      const points2 = [
        [30, 0, 30],
        [30, 30, 30],
        [90, 45, 30],
        [120, 30, 30],
        [30, 0, 0],
        [30, 30, 0],
        [90, 45, 0],
        [120, 30, 0],
      ];
      const points3 = [
        [30, 120, 30],
        [30, 150, 30],
        [120, 120, 30],
        [90, 105, 30],
        [30, 120, 0],
        [30, 150, 0],
        [120, 120, 0],
        [90, 105, 0],
      ];
      const points4 = [
        [90, 45, 30],
        [90, 105, 30],
        [120, 120, 30],
        [120, 30, 30],
        [90, 45, 0],
        [90, 105, 0],
        [120, 120, 0],
        [120, 30, 0],
      ];
      var vertices_d = drawPointTo3DCube(points1)
      vertices_d = vertices_d.concat(drawPointTo3DCube(points2))
      vertices_d = vertices_d.concat(drawPointTo3DCube(points3))
      vertices_d = vertices_d.concat(drawPointTo3DCube(points4))

      console.log(vertices_d)

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices_d),
        gl.STATIC_DRAW
      );

      console.log(vertices_d)

      return vertices_d;
  }
}
