"use strict";

var vs = `#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_matrix;

out vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
`;

var fs = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec4 v_color;

uniform vec4 u_colorMult;

out vec4 outColor;

void main() {
   outColor = v_color * u_colorMult;
}
`;

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("gl-canvas")
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL not Supported");
    return;
  }

  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");

  var oSphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 10, 12, 6);;
  var h1SphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 5, 12, 6);
  var h2SphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 5, 12, 6);
  var cubeBufferInfo   = flattenedPrimitives.createCubeBufferInfo(gl, 20);
  var coneBufferInfo   = flattenedPrimitives.createTruncatedConeBufferInfo(gl, 10, 0, 20, 12, 1, true, false);

  // setup GLSL program
  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  var oSphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, oSphereBufferInfo);
  var h1SphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, h1SphereBufferInfo);
  var h2SphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, h2SphereBufferInfo);
  var cubeVAO   = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo);
  var coneVAO   = twgl.createVAOFromBufferInfo(gl, programInfo, coneBufferInfo);

  function degToRad(d) {
    return d * Math.PI / 180;
  }


  const cameraMenu = document.getElementById("cameraMenu");
  var cameraIndex = 0;

  cameraMenu.addEventListener("click", () => {
    cameraIndex = cameraMenu.selectedIndex;
  });

  var fieldOfViewRadians = degToRad(60);

  // Uniforms for each object.
  var sphereUniforms = {
    u_colorMult: [0.5, 1, 0.5, 1],
    u_matrix: m4.identity(),
  };
  var h1Uniforms = {
    u_colorMult: [1, 0.5, 0.5, 1],
    u_matrix: m4.identity(),
  };
  var h2Uniforms = {
    u_colorMult: [0.5, 0.5, 1, 1],
    u_matrix: m4.identity(),
  };
  var sphereTranslation = [  0, 0, 0];
  var h1Translation   = [-40, 0, 0];
  var h2Translation   = [ 40, 0, 0];

  var h1Angle = 0;
  var h1Angle2 = 0;
  var h2Angle = 0;
  var h2Angle2 = 0;

  function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
    var matrix = m4.translate(viewProjectionMatrix,
        translation[0],
        translation[1],
        translation[2]);
    matrix = m4.xRotate(matrix, xRotation);
    return m4.yRotate(matrix, yRotation);
  }

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time = time * 0.0005;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];

    if (cameraIndex == 0) {
      cameraPosition = [0, 0, 100];
      target = [0, 0, 0];
      up = [0, 1, 0];
    } else if( cameraIndex == 1) {
      cameraPosition = [0, 0, 0];
      target = [0, 0, 100];
      up = [0, 1, 0];
    } else if (cameraIndex == 2) {
      cameraPosition = h1Translation;
      target = [0, 0, 0];
      up = [0, 1, 0];
    } else {
      cameraPosition = h2Translation;
      target = [0, 0, 0];
      up = [0, 1, 0];
    }



    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var h1XRotation   = -time;
    var h1YRotation   =  time;
    var h2XRotation   =  time;
    var h2YRotation   = -time;


    h1Angle += 1;
    h1Angle2 += 3/36;
    h1Translation[2] = 40 * Math.cos(degToRad(h1Angle));
    h1Translation[1] = 40 * Math.sin(degToRad(h1Angle)) * Math.cos(degToRad(h1Angle2));
    h1Translation[0] = 40 * Math.sin(degToRad(h1Angle)) * Math.sin(degToRad(h1Angle2));

    h2Angle += 1;
    h2Angle2 -= 3/36;
    h2Translation[2] = 40 * Math.cos(degToRad(h2Angle));
    h2Translation[1] = 40 * Math.sin(degToRad(h2Angle)) * Math.cos(degToRad(h2Angle2));
    h2Translation[0] = 40 * Math.sin(degToRad(h2Angle)) * Math.sin(degToRad(h2Angle2));


    gl.useProgram(programInfo.program);

    // ------ Draw the sphere --------

    // Setup all the needed attributes.
    gl.bindVertexArray(oSphereVAO);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // Set the uniforms we just computed
    twgl.setUniforms(programInfo, sphereUniforms);

    twgl.drawBufferInfo(gl, oSphereBufferInfo);

    // ------ Draw the cube --------

    // Setup all the needed attributes.
    gl.bindVertexArray(h1SphereVAO);

    h1Uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        h1Translation,
        h1XRotation,
        h1YRotation);

    // Set the uniforms we just computed
    twgl.setUniforms(programInfo, h1Uniforms);

    twgl.drawBufferInfo(gl, h1SphereBufferInfo);

    // ------ Draw the cone --------

    // Setup all the needed attributes.
    gl.bindVertexArray(h2SphereVAO);

    h2Uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        h2Translation,
        h2XRotation,
        h2YRotation);

    // Set the uniforms we just computed
    twgl.setUniforms(programInfo, h2Uniforms);

    twgl.drawBufferInfo(gl, h2SphereBufferInfo);

    requestAnimationFrame(drawScene);
  }
}

main();
