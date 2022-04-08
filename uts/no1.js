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
var scale = [1.0,1.0]; //default scale
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

let currObj = 0

let objectProps = [
    {
        angle: 0,
        position: [300, 300],
        scale: 1.0
    },
    {
        angle: 0,
        position: [200, 400],
        scale: 1.0
    },
    {
        angle: 0,
        position: [200, 200],
        scale: 1.0
    },
]


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    document.getElementById("obj1").onclick = () => {currObj = 0}
    document.getElementById("obj2").onclick = () => {currObj = 1}
    document.getElementById("obj3").onclick = () => {currObj = 2}

    document.addEventListener("keydown", (e) => {
        if (e.key == 'r') {
            objectProps[currObj].angle += 3
        }
        if (e.key == 'z') {
            objectProps[currObj].scale += 0.05
        }
        if (e.key == 'x') {
            objectProps[currObj].scale -= 0.05
        }
        if (e.key == 'ArrowRight') {
            objectProps[currObj].position[0] += 5
        }
        if (e.key == 'ArrowLeft') {
            objectProps[currObj].position[0] -= 5
        }
        if (e.key == 'ArrowUp') {
            objectProps[currObj].position[1] -= 5
        }
        if (e.key == 'ArrowDown') {
            objectProps[currObj].position[1] += 5
        }
    })


    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");
	
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var letterbuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, letterbuffer );

	
    // Associate out shader variables with our data buffer
	
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	colorUniformLocation = gl.getUniformLocation(program, "u_color");
	
	matrixLocation = gl.getUniformLocation(program, "u_matrix");
    middlewidth = Math.floor(gl.canvas.width/2);

	primitiveType = gl.TRIANGLES;
	render(); //default render
}

function render() 
{
	currentposition += movement;
	// currentscale += scalefactor;
	
	if (currentposition > middlewidth) {
		currentposition = middlewidth;
		movement = -movement;
		
	}; 
	if (currentposition < 0) {
		currentposition = 0; 
		movement = -movement;
	}; 

	if (currentscale > 2){
		currentscale = 2.0;
		scalefactor = -scalefactor;
	};
	
	if (currentscale < 0.005){
		currentscale = 0.005;
		scalefactor = -scalefactor;
	};
    
    // angle += 1.0;
	
    gl.clear( gl.COLOR_BUFFER_BIT );
	
    drawA();
	drawSword();
	drawHouse();
	
	requestAnimationFrame(render); //refresh
	
}


function drawSword() {
	count = setGeometrySword(gl);
	translation = [middlewidth-130,gl.canvas.height/2-90];
	
	angleInRadians = 360 - (objectProps[0].angle * Math.PI/180); //rotating counter clockwise

	
	matrix = m3.identity();
	
	projectionMatrix = m3.projection(gl.canvas.width, gl.canvas.height);
	translationMatrix = m3.translation(objectProps[0].position[0], objectProps[0].position[1]);
    rotationMatrix = m3.rotation(angleInRadians);
    scaleMatrix = m3.scaling(objectProps[0].scale, objectProps[0].scale);
	moveOriginMatrix = m3.translation(-65, -90);
	
    // Multiply the matrices.
    matrix = m3.multiply(projectionMatrix, translationMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
	matrix = m3.multiply(matrix, scaleMatrix);
	matrix = m3.multiply(matrix, moveOriginMatrix);

	//set color
	gl.uniform4f(colorUniformLocation, 0, 0, 1, 1);
	
    // Set the matrix.
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

	//gl.clear( gl.COLOR_BUFFER_BIT );
	gl.drawArrays( primitiveType, offset, count / 2 );
	
	
}

function drawHouse() {
	count = setGeometryHouse(gl); 
	translation=[middlewidth+100,gl.canvas.height/2-90];
	
	angleInRadians = (objectProps[1].angle * Math.PI/180); //rotating counter clockwise


    matrix = m3.identity();
	projectionMatrix = m3.projection(gl.canvas.width, gl.canvas.height);
	translationMatrix = m3.translation(objectProps[1].position[0], objectProps[1].position[1]);
    rotationMatrix = m3.rotation(angleInRadians);
    scaleMatrix = m3.scaling(objectProps[1].scale,objectProps[1].scale);
	moveOriginMatrix = m3.translation(-50, -90);
	
    // Multiply the matrices.
    matrix = m3.multiply(projectionMatrix, translationMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
	matrix = m3.multiply(matrix, scaleMatrix);
	matrix = m3.multiply(matrix, moveOriginMatrix);

	//set color
	gl.uniform4f(colorUniformLocation, 1.0, 0, 0, 1);
	
    // Set the matrix.
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

	//gl.clear( gl.COLOR_BUFFER_BIT );
	gl.drawArrays( primitiveType, offset, count / 2);
	
	
}

function drawA() {
    count = setGeometry(gl);
	
	angleInRadians = (objectProps[2].angle * Math.PI/180); //rotating counter clockwise

	
	matrix = m3.identity();
	
	projectionMatrix = m3.projection(gl.canvas.width, gl.canvas.height);
	translationMatrix = m3.translation(objectProps[2].position[0], objectProps[2].position[1]);
    rotationMatrix = m3.rotation(angleInRadians);
    scaleMatrix = m3.scaling(objectProps[2].scale, objectProps[2].scale);
	moveOriginMatrix = m3.translation(-65, -90);
	
    // Multiply the matrices.
    matrix = m3.multiply(projectionMatrix, translationMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
	matrix = m3.multiply(matrix, scaleMatrix);
	matrix = m3.multiply(matrix, moveOriginMatrix);

	//set color
	gl.uniform4f(colorUniformLocation, 1, 0, 1, 1);
	
    // Set the matrix.
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

	//gl.clear( gl.COLOR_BUFFER_BIT );
	gl.drawArrays( primitiveType, offset, count / 2);
}

function setGeometry(gl) {
    var floatArray5;
    floatArray5 = new Float32Array([
        	  0, 50,
			  -50, -50,
			  25, 0,
			  25, 25,
			  25, 0,
			  50, 25,
			  -50, 25,
			  50, -50,
			  25, 25,
			  0, 0
    ])
    gl.bufferData(gl.ARRAY_BUFFER, floatArray5, gl.STATIC_DRAW);
    return floatArray5.length
}

function setGeometrySword(gl) {
    var floatArray;
    floatArray = new Float32Array([
        // Segitiga bawah
        -20, 60,
        10, 90,
        10, 60,
        10, 60,
        10, 90,
        40, 60,

        // Handle
        0, 0,
        20, 0,
        0, 60,
        0, 60,
        20, 0,
        20, 60,

        // Hilt
        -65, 0,
        -65, -16,
        85, 0,
        85, 0,
        -65, -16,
        85, -16,

        // Segitiga kiri hilt
        -65, 0,
        -75, -8,
        -65, -16,

        // Segitiga kanan hilt
        85, 0,
        95, -8,
        85, -16,

        // The blade
        -5, -16,
        -5, -160,
        25, -16,
        25, -16,
        -5, -160,
        25, -160,

        // Segitiga di atas nya blade
        -5, -160,
        10, -180,
        25, -160

    ])
    gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);

    return floatArray.length;
}

function setGeometryHouse(gl) {
    var floatArray;
    floatArray = new Float32Array([
        // Persegi panjang tengah
        0, 0,
        0, -20,
        100, 0,
        100, 0,
        0, -20,
        100, -20,

        // Kaki kiri
        0, 0,
        0, 60,
        20, 60,
        20, 60,
        0, 0,
        20, 0,

        // Kaki kanan
        100, 0,
        100, 60,
        80, 60,
        80, 60,
        100, 0,
        80, 0,
        
        // Segitiga kiri
        0, -20,
        30, -20,
        30, -60,

        // Segitiga kanan
        100, -20,
        70, -20,
        70, -60,

        // Segitiga atas kiri
        30, -60,
        50, -60,
        50, -90,

        // Segitiga atas kanan
        70, -60,
        50, -60,
        50, -90,

        // Tanda plus di tengah jendela (vertikal)
        49, -20,
        49, -60,
        51, -20,
        51, -20,
        49, -60,
        51, -60,

        // Tanda plus di tengah jendela (horizontal)
        30, -39,
        30, -41,
        70, -39,
        70, -39,
        30, -41,
        70, -41,

        // Cerobong Asap
        7, -20,
        7, -85,
        22, -20,
        22, -20,
        7, -85,
        22, -85,

    ])
    gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);

    return floatArray.length;
}

