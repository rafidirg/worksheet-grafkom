"use strict";

var canvas;
var gl;

var primitiveType;
var offset = 0;
var count = 96;
	

var angleCam = 0;
var angleFOV = 60;
var fRotationRadians = 0;

var matrix;

var translationMatrix;
var rotationMatrix;
var scaleMatrix;
var projectionMatrix;
var cameraMatrix;
var viewMatrix;
var viewProjectionMatrix;

var worldViewProjectionMatrix;
var worldInverseTransposeMatrix;
var worldInverseMatrix;
var worldMatrix;

var FOV_Radians; //field of view
var aspect; //projection aspect ratio
var zNear; //near view volume
var zFar;  //far view volume

var cameraPosition = [100, 150, 200]; //eye/camera coordinates
var UpVector = [0, 1, 0]; //up vector
var fPosition = [0, 35, 0]; //at 


var worldViewProjectionLocation;
var worldInverseTransposeLocation;
var colorLocation;
var lightWorldPositionLocation;
var worldLocation;

window.onload = function init()
{

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

	
	gl.enable(gl.CULL_FACE); //enable depth buffer
	gl.enable(gl.DEPTH_TEST);

	//initial default

	fRotationRadians = degToRad(0);
    FOV_Radians = degToRad(60);
    aspect = canvas.width / canvas.height;
    zNear = 1;
    zFar = 2000;
	
	projectionMatrix = m4.perspective(FOV_Radians, aspect, zNear, zFar); //setup perspective viewing volume
	
    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
	
	worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
    worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
	colorLocation = gl.getUniformLocation(program, "u_color");
	lightWorldPositionLocation =  gl.getUniformLocation(program, "u_lightWorldPosition");
	worldLocation =  gl.getUniformLocation(program, "u_world");
	
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );

    var positionLocation = gl.getAttribLocation( program, "a_position" );
    gl.vertexAttribPointer( positionLocation, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLocation );


	count = setGeometryI(gl) / 3;	
	
	
	var normalBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer );
	
    // Associate out shader variables with our data buffer
	
    var normalLocation = gl.getAttribLocation(program, "a_normal");
	gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray( normalLocation );

	setNormalsI(gl);
	
	//update FOV
	var angleCamValue = document.getElementById("Cameravalue");
	angleCamValue.innerHTML = angleCam;
	document.getElementById("sliderCam").onchange = function(event) {		
	    angleCamValue.innerHTML = event.target.value;
		fRotationRadians = degToRad(event.target.value);
		render();
    };
	
	primitiveType = gl.TRIANGLES;
	render(); //default render
}

function render() 
{
    // Compute the camera's matrix using look at.
    cameraMatrix = m4.lookAt(cameraPosition, fPosition, UpVector);

    // Make a view matrix from the camera matrix
    viewMatrix = m4.inverse(cameraMatrix);
	
	// Compute a view projection matrix
	viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    worldMatrix = m4.yRotation(fRotationRadians);

    // Multiply the matrices.
    worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
    worldInverseMatrix = m4.inverse(worldMatrix);
    worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

    // Set the matrices
    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
	gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
	
    // Set the color to use
    gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green

    // set the light direction.
    gl.uniform3fv(lightWorldPositionLocation, [20, 30, 60]);
	
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawArrays( primitiveType, offset, count );

}

function radToDeg(r) {
    return r * 180 / Math.PI;
  }

function degToRad(d) {
    return d * Math.PI / 180;
  }

function setGeometryI(gl) {
  var position = new Float32Array([
    // DRAW I
    // Top row front
      0,  0, 0,
      0, 30, 0,
    90,  0, 0,
      0, 30, 0,
    90, 30, 0,
    90,  0, 0,

    // Middle column front
    30,  30, 0,
    30, 150, 0,
    60,  30, 0,
    30, 150, 0,
    60, 150, 0,
    60,  30, 0,

    // Bottom row front
      0, 150, 0,
      0, 180, 0,
    90, 150, 0,
      0, 180, 0,
    90, 180, 0,
    90, 150, 0,

    // top row back
      0,  0, 30,
    90,  0, 30,
      0, 30, 30,
      0, 30, 30,
    90,  0, 30,
    90, 30, 30,

    // Middle column back
    30,  30, 30,
    60,  30, 30,
    30, 150, 30,
    30, 150, 30,
    60,  30, 30,
    60, 150, 30,

    // Bottom row back
      0, 150, 30,
    90, 150, 30,
      0, 180, 30,
      0, 180, 30,
    90, 150, 30, 
    90, 180, 30,

    // upper Top
      0, 0,  0,
    90, 0,  0,
    90, 0, 30,
      0, 0,  0,
    90, 0, 30,
      0, 0, 30,

    // Under Top 1
    0, 30, 0,
    0, 30, 30,
    30, 30, 30,
    0, 30, 0,
    30, 30, 30,
    30, 30, 0,

    // Under Top 2
    60, 30, 0,
    60, 30, 30,
    90, 30, 30,
    60, 30, 0,
    90, 30, 30,
    90, 30, 0,

    // Under bottom
      0, 180,  0,
      0, 180, 30,
    90, 180, 30,
      0, 180,  0,
    90, 180, 30,
    90, 180,  0,

    // Upper bottom 1
      0, 150, 0,
    30, 150, 0,
    30, 150, 30,
      0, 150, 0,
    30, 150, 30,
      0, 150, 30,

    // Upper bottom 2
    60, 150, 0,
    90, 150, 0,
    90, 150, 30,
    60, 150, 0,
    90, 150, 30,
    60, 150, 30,
    
    // Top right
    90, 0, 0,
    90, 30, 0,
    90, 30, 30,
    90, 0, 0,
    90, 30, 30,
    90, 0, 30,

    // Middle right
    60, 30, 0,
    60, 150, 0,
    60, 150, 30,
    60, 30, 0,
    60, 150, 30,
    60, 30, 30,

    // Bottom right
    90, 150, 0,
    90, 180, 0,
    90, 180, 30,
    90, 150, 0,
    90, 180, 30,
    90, 150, 30,

    // Top left
    0, 0, 0,
    0, 0, 30,
    0, 30, 30,
    0, 0, 0,
    0, 30, 30,
    0, 30, 0,

    // Middle left
    30, 30, 0,
    30, 30, 30,
    30, 150, 30,
    30, 30, 0,
    30, 150, 30,
    30, 150, 0,

    // Bottom left
    0, 150, 0,
    0, 150, 30,
    0, 180, 30,
    0, 150, 0,
    0, 180, 30,
    0, 180, 0,


    // DRAW D
    // Top front
    150,  0, 0,
    150, 30, 0,
    270,  0, 0,
    150, 30, 0,
    270, 30, 0,
    270,  0, 0,

    // Left column front
    180,  30, 0,
    180, 150, 0,
    210,  30, 0,
    180, 150, 0,
    210, 150, 0,
    210,  30, 0,

    // Bottom front
    150, 150, 0,
    150, 180, 0,
    270, 150, 0,
    150, 180, 0,
    270, 180, 0,
    270, 150, 0,

    // Top block front
    270, 30, 0,
    270, 60, 0,
    300, 30, 0,
    270, 60, 0,
    300, 60, 0,
    300, 30, 0,

    // Bottom block front
    270, 120, 0,
    270, 150, 0,
    300, 120, 0,
    270, 150, 0,
    300, 150, 0,
    300, 120, 0,

    // Right column front
    300,  60, 0,
    300, 120, 0,
    330,  60, 0,
    300, 120, 0,
    330, 120, 0,
    330,  60, 0,

    // Top back
    150,  0, 30,
    270,  0, 30,
    150, 30, 30,
    270,  0, 30,
    270, 30, 30,
    150, 30, 30,

    // Left column back
    180,  30, 30,
    210,  30, 30,
    180, 150, 30,
    210,  30, 30,
    210, 150, 30,
    180, 150, 30,

    // Bottom back
    150, 150, 30,
    270, 150, 30,
    150, 180, 30,
    270, 150, 30,
    270, 180, 30,
    150, 180, 30,

    // Top block back
    270, 30, 30,
    300, 30, 30,
    270, 60, 30,
    300, 30, 30,
    300, 60, 30,
    270, 60, 30,

    // Bottom block back
    270, 120, 30,
    300, 120, 30,
    270, 150, 30,
    300, 120, 30,
    300, 150, 30,
    270, 150, 30,

    // Right column back
    300,  60, 30,
    330,  60, 30,
    300, 120, 30,
    330,  60, 30,
    330, 120, 30,
    300, 120, 30,

    // Upper Top
    150, 0,  0,
    270, 0,  0,
    270, 0, 30,
    150, 0,  0,
    270, 0, 30,
    150, 0, 30,

    // Under top 1
    150, 30, 0,
    150, 30, 30,
    180, 30, 30,
    150, 30, 0,
    180, 30, 30,
    180, 30, 0,

    // Under top 2
    210, 30, 0,
    210, 30, 30,
    270, 30, 30,
    210, 30, 0,
    270, 30, 30,
    270, 30, 0,

    // Under bottom
    150, 180, 0,
    150, 180, 30,
    270, 180, 30,
    150, 180, 0,
    270, 180, 30,
    270, 180, 0,
    
    // upper bottom 1
    150, 150, 0,
    180, 150, 0,
    180, 150, 30,
    150, 150, 0,
    180, 150, 30,
    150, 150, 30,

    // Upper bottom 2
    210, 150, 0,
    270, 150, 0,
    270, 150, 30,
    210, 150, 0,
    270, 150, 30,
    210, 150, 30,

    // Upper Top Block
    270, 30, 0,
    300, 30, 0,
    300, 30, 30,
    270, 30, 0,
    300, 30, 30,
    270, 30, 30,

    // Under top block
    270, 60, 0,
    270, 60, 30,
    300, 60, 30,
    270, 60, 0,
    300, 60, 30,
    300, 60, 0,

    // Upper bottom Block
    270, 120, 0,
    300, 120, 0,
    300, 120, 30,
    270, 120, 0,
    300, 120, 30,
    270, 120, 30,

    // Under bottom block
    270, 150, 0,
    270, 150, 30,
    300, 150, 30,
    270, 150, 0,
    300, 150, 30,
    300, 150, 0,

    // Upper right Block
    300, 60, 0,
    330, 60, 0,
    330, 60, 30,
    300, 60, 0,
    330, 60, 30,
    300, 60, 30,

    // Under right block
    300, 120, 0,
    300, 120, 30,
    330, 120, 30,
    300, 120, 0,
    330, 120, 30,
    330, 120, 0,

    // Right right block
    330, 60, 0,
    330, 120, 0,
    330, 120, 30,
    330, 60, 0,
    330, 120, 30,
    330, 60, 30,

    // Right top block
    300, 30, 0,
    300, 60, 0,
    300, 60, 30,
    300, 30, 0,
    300, 60, 30,
    300, 30, 30,

    // Right bottom block
    300, 120, 0,
    300, 150, 0,
    300, 150, 30,
    300, 120, 0,
    300, 150, 30,
    300, 120, 30,

    // Right top
    270, 0, 0,
    270, 30, 0,
    270, 30, 30,
    270, 0, 0,
    270, 30, 30,
    270, 0, 30,

    // Right bottom
    270, 150, 0,
    270, 180, 0,
    270, 180, 30,
    270, 150, 0, 
    270, 180, 30,
    270, 150, 30,

    // Right left column
    210, 30, 0,
    210, 150, 0,
    210, 150, 30,
    210, 30, 0,
    210, 150, 30,
    210, 30, 30,

    // Left top
    150, 0, 0,
    150, 0, 30,
    150, 30, 30,
    150, 0, 0, 
    150, 30, 30,
    150, 30, 0,

    // Left bottom
    150, 150, 0,
    150, 150, 30,
    150, 180, 30,
    150, 150, 0,
    150, 180, 30,
    150, 180, 0,

    // Left left column
    180, 30, 0,
    180, 30, 30,
    180, 150, 30,
    180, 30, 0,
    180, 150, 30,
    180, 150, 0,

    // Left top block
    270, 30, 0,
    270, 30, 30,
    270, 60, 30,
    270, 30, 0,
    270, 60, 30,
    270, 60, 0,

    // left bottom block
    270, 120, 0,
    270, 120, 30,
    270, 150, 30,
    270, 120, 0,
    270, 150, 30,
    270, 150, 0,

    // left Right column
    300, 60, 0,
    300, 60, 30,
    300, 120, 30,
    300, 60, 0, 
    300, 120, 30,
    300, 120, 0,
  ])

  var matrix = m4.xRotation(Math.PI),
  matrix = m4.translate(matrix, -150, -100, -15);

  for (var ii = 0; ii < position.length; ii += 3) {
    var vector = m4.transformPoint(matrix, [position[ii + 0], position[ii + 1], position[ii + 2], 1]);
    position[ii + 0] = vector[0];
    position[ii + 1] = vector[1];
    position[ii + 2] = vector[2];
  }

  gl.bufferData(gl.ARRAY_BUFFER,  position,   gl.STATIC_DRAW);

  return position.length;
}

function setNormalsI(gl){
  var normals = new Float32Array([
    // DRAW I
    // Bottom row front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // Middle column front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // Top row front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // Bottom row back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // Middle column back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // Top row back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // upper Top
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Under Top 1
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    // Under Top 2
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // Under bottom
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    
    // Upper bottom 1
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Upper bottom 2
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Top right
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    
    // Middle right
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // Bottom right
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // Top left
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    // Middle left
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    // Bottom left
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    // DRAW D
    // Top front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // Left column front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // Bottom front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // Top block front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // Bottom block front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,


    // Right column front
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,


    // Top back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // Left column back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // Bottom back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // Top block back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // Bottom block back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // Right column back
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,

    // Upper Top
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Under top 1
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // Under top 2
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // Under bottom
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    
    // upper bottom 1
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Upper bottom 2
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Upper Top Block
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Under top block
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // Upper bottom Block
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Under bottom block
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // Upper right Block
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    // Under right block
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    // Right right block
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    
    // Right top block
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    
    // Right bottom block
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // Right top
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // Right bottom
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // Right left column
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // Left top
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    // Left bottom
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    // Left left column
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    // Left top block
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    // left bottom block
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    // left Right column
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
  ])
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}