"use strict";

var canvas;
var gl;

var axis = 0;
var xAxis = 0;
var yAxis =1;
var zAxis = 2;
var theta = [0, 0, 0];
var thetaLoc;
var flag = true;
var numElements = 132;

var vertices = [
    vec3(-0.25, 0.35,  0.1),
    vec3(-0.25, -0.35,  0.1),
    vec3(-0.2,  0.4,  0.1),
    vec3(-0.2, -0.4,  0.1),
    vec3(0.2, 0.4, 0.1),
    vec3(0.2, -0.4, 0.1),
    vec3(0.25,  0.35, 0.1),
    vec3(0.25, -0.35, 0.1),
    vec3(-0.35,  0.4, 0),
    vec3(-0.35,  -0.4, 0),
    vec3(-0.25,  -0.5, 0),
    vec3(0.25,  -0.5, 0),
    vec3(0.35,  -0.4, 0),
    vec3(0.35,  0.4, 0),
    vec3(0.25,  0.5, 0),
    vec3(-0.25,  0.5, 0),
    vec3(-0.25, 0.35,  -0.1),
    vec3(-0.25, -0.35,  -0.1),
    vec3(-0.2,  0.4,  -0.1),
    vec3(-0.2, -0.4,  -0.1),
    vec3(0.2, 0.4, -0.1),
    vec3(0.2, -0.4, -0.1),
    vec3(0.25,  0.35, -0.1),
    vec3(0.25, -0.35, -0.1),
];

var vertexColors = [
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.07, 0.24, 0.0, 1.0),  // black
    vec4(0.07, 0.24, 0.0, 1.0),  // black
    vec4(0.07, 0.24, 0.0, 1.0),  // black
    vec4(0.07, 0.24, 0.0, 1.0),  // black
    vec4(0.07, 0.24, 0.0, 1.0),  // black
    vec4(0.07, 0.24, 0.0, 1.0),  // black
    vec4(0.07, 0.24, 0.0, 1.0),  // black
    vec4(0.07, 0.24, 0.0, 1.0),  // black
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
    vec4(0.22, 0.79, 0.32, 1.0),  // green
];

// the large surface
var large_surface = [
    0, 1, 2,
    1, 2, 3,
    2, 3, 4,
    3, 4, 5,
    4, 5, 6,
    5, 6, 7,
]

// initial with side indices
var indices = [
    0, 1, 8,
    9, 1, 8,
    9, 1, 10,
    10, 1, 3,
    10, 3, 11,
    11, 3, 5,
    11, 5, 12,
    12, 5, 7,
    12, 7, 13,
    13, 7, 6,
    13, 6, 4,
    13, 4, 14,
    14, 4, 2,
    15, 14, 2,
    15, 2, 0,
    15, 0, 8,
];

indices.forEach((item, index) => {
    if (item < 8){
        indices.push(item + 16)
    }
    else{
        indices.push(item)
    }
})

for( var i =0; i < 2; i++){
    large_surface.forEach((item, index)=> {
        indices.push(item + (i * 16))
    })
}


init();

function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");


    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // array element buffer

    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    // color array atrribute buffer

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    // vertex array attribute buffer

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc );

    thetaLoc = gl.getUniformLocation(program, "uTheta");

    //event listeners for buttons

    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    render();
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(flag) theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, theta);

    gl.drawElements(gl.TRIANGLES, numElements, gl.UNSIGNED_BYTE, 0);
    requestAnimationFrame(render);
}
