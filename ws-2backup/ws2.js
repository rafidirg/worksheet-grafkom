"use strict";

var vs = `#version 300 es
in vec4 a_position;
in vec3 a_normal; //change color to normal vector

uniform vec3 u_lightWorldPosition;

uniform mat4 u_world;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

out vec3 v_normal;
out vec3 v_surfaceToLight;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_worldViewProjection * a_position;

  // orient the normals and pass to the fragment shader
  v_normal = mat3(u_worldInverseTranspose) * a_normal;

  // compute the world position of the surfoace
  vec3 surfaceWorldPosition = (u_world * a_position).xyz;

  // compute the vector of the surface to the light
  // and pass it to the fragment shader
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
}`

var fs = `#version 300 es

precision mediump float;

// Passed in from the vertex shader.
in vec3 v_normal;
in vec3 v_surfaceToLight;

uniform vec4 u_color;

out vec4 FragColor;

void main() {
  // because v_normal is a varying it's interpolated
  // we it will not be a uint vector. Normalizing it
  // will make it a unit vector again
  vec3 normal = normalize(v_normal);

  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

  float light = dot(normal, surfaceToLightDirection);

  FragColor = u_color;

  // Lets multiply just the color portion (not the alpha)
  // by the light
  FragColor.rgb *= light;
}`

const cameraPosition = [10, 10, 10];
const upVector = [0, 1, 0];
const fPosition = [0, 0, 0];

var offset = 0;

var Node = function() {
    this.children = [];
    this.localMatrix = m4.identity();
    this.worldMatrix = m4.identity();
};

Node.prototype.setParent = function(parent) {
    // remove us from our parent
    if (this.parent) {
        var ndx = this.parent.children.indexOf(this);
        if (ndx >= 0) {
            this.parent.children.splice(ndx, 1);
        }
    }

    // Add us to our new parent
    if (parent){
        parent.child.append(this);
    }
    this.parent = parent;
};

Node.prototype.updateWorldMatrix = function(parentWorldMatrix) {
    if (parentWorldMatrix) {
      // a matrix was passed in so do the math and
      // store the result in `this.worldMatrix`.
      m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
    } else {
      // no matrix was passed in so just copy.
      m4.copy(this.localMatrix, this.worldMatrix);
    }
   
    // now process all the children
    var worldMatrix = this.worldMatrix;
    this.children.forEach(function(child) {
      child.updateWorldMatrix(worldMatrix);
    });
  };


function main() {
    const canvas = document.getElementById("gl-canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL2 is not Available!");
        return;
    }
    
    var program = initShaders(gl, "vertex-shader", "fragment-shader")
    gl.useProgram(program);

    var positionLocation =
        gl.getAttribLocation(program, "a_position");
    var normalLocation =
        gl.getAttribLocation(program, "a_normal");

    var worldViewProjectionLocation = 
        gl.getUniformLocation(program, "u_worldViewProjection");
    var worldInverseTransposeLocation = 
        gl.getUniformLocation(program, "u_worldInverseTranspose");
	var colorLocation = 
        gl.getUniformLocation(program, "u_color");
	var lightWorldPositionLocation =  
        gl.getUniformLocation(program, "u_lightWorldPosition");
	var worldLocation =  
        gl.getUniformLocation(program, "u_world");

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Enable Attrib Position
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    // Enable Attrib Normal
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);

    const buffers = {
        position: positionBuffer,
        normal: normalBuffer
    }

    // Projection Matrix
    const projectionMatrix = m4.perspective(
        degToRad(60),
        canvas.width / canvas.height,
        1,
        200
    )

    render()

    function render() {

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE)
        
        const cameraMatrix = m4.lookAt(cameraPosition, upVector, fPosition);
        const viewMatrix = m4.inverse(cameraMatrix);
        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
        
        const worldMatrix = m4.yRotation(0);
        const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
        const worldInverseMatrix = m4.inverse(worldMatrix);
        const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

        gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
        gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
        gl.uniformMatrix4fv(worldLocation, false, worldMatrix);

        gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1 ]);
        gl.uniform3fv(lightWorldPositionLocation, [5, 5, 5]);

        gl.clearColor(0, 0, 0, 0.1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        drawSpiderBody(gl, buffers);

    }

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }
    
    function degToRad(d) {
        return d * Math.PI / 180;
    }

}

main();