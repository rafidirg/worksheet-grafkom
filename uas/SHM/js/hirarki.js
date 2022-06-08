var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl2");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}


//adapted from http://learnwebgl.brown37.net/11_advanced_rendering/shadows.html
function createFrameBufferObject(gl, width, height) {
    var frameBuffer, depthBuffer;

    frameBuffer = gl.createFramebuffer();

    depthBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, depthBuffer);
    for (var i = 0; i < 6; i++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    frameBuffer.depthBuffer = depthBuffer;
    frameBuffer.width = width;
    frameBuffer.height = height;

    return frameBuffer;
}

var shaderProgram;
var shadowMapShaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "fs");
    var vertexShader = getShader(gl, "vs");
    shaderProgram = gl.createProgram();
    if (!shaderProgram) { alert("gak ok deh kakak"); }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    shaderProgram.vertexTextureAttribute = gl.getAttribLocation(shaderProgram, "vTexCoord");
    gl.enableVertexAttribArray(shaderProgram.vertexTextureAttribute);
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.useMaterialUniform = gl.getUniformLocation(shaderProgram, "uUseMaterial");
    shaderProgram.useTextureUniform = gl.getUniformLocation(shaderProgram, "uUseTexture");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
    shaderProgram.pointLightingSpecularColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingSpecularColor");
    shaderProgram.pointLightingDiffuseColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingDiffuseColor");
    shaderProgram.uMaterialAmbientColorUniform = gl.getUniformLocation(shaderProgram, "uMaterialAmbientColor");
    shaderProgram.uMaterialDiffuseColorUniform = gl.getUniformLocation(shaderProgram, "uMaterialDiffuseColor");
    shaderProgram.uMaterialSpecularColorUniform = gl.getUniformLocation(shaderProgram, "uMaterialSpecularColor");
    shaderProgram.uMaterialShininessUniform = gl.getUniformLocation(shaderProgram, "uMaterialShininess");
    shaderProgram.uFarPlaneUniform = gl.getUniformLocation(shaderProgram, "uFarPlane");
    shaderProgram.shadowMapUniform = gl.getUniformLocation(shaderProgram, "shadowmap");

    var shadowMapFragmentShader = getShader(gl, "fs-shadowmap");
    var shadowMapVertexShader = getShader(gl, "vs-shadowmap");
    shadowMapShaderProgram = gl.createProgram();
    gl.attachShader(shadowMapShaderProgram, shadowMapVertexShader);
    gl.attachShader(shadowMapShaderProgram, shadowMapFragmentShader);
    gl.linkProgram(shadowMapShaderProgram);
    if (!gl.getProgramParameter(shadowMapShaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shadowMapShaderProgram);
    shadowMapShaderProgram.mvMatrixUniform = gl.getUniformLocation(shadowMapShaderProgram, "uMVMatrix");
    shadowMapShaderProgram.pMatrixUniform = gl.getUniformLocation(shadowMapShaderProgram, "uPMatrix");
    shadowMapShaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shadowMapShaderProgram, "uPointLightingLocation");
    shadowMapShaderProgram.uFarPlaneUniform = gl.getUniformLocation(shadowMapShaderProgram, "uFarPlane");
    shadowMapShaderProgram.vertexPositionAttribute = gl.getAttribLocation(shadowMapShaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shadowMapShaderProgram.vertexPositionAttribute);

    gl.useProgram(shaderProgram);
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix(shadow) {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
    if (shadow) {
        gl.uniformMatrix4fv(shadowMapShaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shadowMapShaderProgram.mvMatrixUniform, false, mvMatrix);
    } else {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        var normalMatrix = mat3.create();
        mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.transpose(normalMatrix);
        gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
    }
}

function setMatrixUniforms(shadow) {
    if (shadow) {
        gl.uniformMatrix4fv(shadowMapShaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shadowMapShaderProgram.mvMatrixUniform, false, mvMatrix);
    } else {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        var normalMatrix = mat3.create();
        mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.transpose(normalMatrix);
        gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var cubeVertexPositionBuffer;
var cubeVertexNormalBuffer;
var cubeInsidesVertexNormalBuffer;
var cubeVertexIndexBuffer;
var cubeTextureBuffer;

var cylinderVertexPositionBuffer;
var cylinderVertexNormalBuffer;
var cylinderVertexIndexBuffer;
var cylinderTextureBuffer;

var sphereVertexPositionBuffer;
var sphereVertexNormalBuffer;
var sphereVertexIndexBuffer;
var sphereTextureBuffer;

var shadowFrameBuffer;

var roomMaterial;
var spiderMaterial;
var birdMaterial;

var objectDrawMode;

function initBuffers() {
    //DEFINING CUBE
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    vertices = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,
        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,
        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;
    cubeVertexNormalBuffer = gl.createBuffer();
    cubeInsidesVertexNormalBuffer = gl.createBuffer();
    var vertexNormals = [
        // Front face
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        // Back face
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        // Top face
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        // Bottom face
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        // Right face
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        // Left face
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
    ];
    var vertexInsidesNormals = [];
    for (var i = 0; i < vertexNormals.length; i++) {
        vertexInsidesNormals.push(vertexNormals[i] * -1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    cubeVertexNormalBuffer.itemSize = 3;
    cubeVertexNormalBuffer.numItems = 24;

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeInsidesVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexInsidesNormals), gl.STATIC_DRAW);
    cubeInsidesVertexNormalBuffer.itemSize = 3;
    cubeInsidesVertexNormalBuffer.numItems = 24;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2, 0, 2, 3,    // Front face
        4, 5, 6, 4, 6, 7,    // Back face
        8, 9, 10, 8, 10, 11,  // Top face
        12, 13, 14, 12, 14, 15, // Bottom face
        16, 17, 18, 16, 18, 19, // Right face
        20, 21, 22, 20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;

    var textureCubeCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    cubeTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCubeCoords), gl.STATIC_DRAW);
    cubeTextureBuffer.itemSize = 2;
    cubeTextureBuffer.numItems = 24;

    //DEFINING CYLINDER
    //try making it with 20 segments
    var segment = 20;
    var deltaTheta = Math.PI * 360 / (180 * segment);
    var x, z;
    var cylinderBotVertices = [0, 0, 0];
    var cylinderTopVertices = [0, 1, 0];
    var cylinderSideVertices = [];
    var cylinderBotNormals = [0.0, -1.0, 0.0];
    var cylinderTopNormals = [0.0, 1.0, 0.0];
    var cylinderSideNormals = [];
    var cylinderBotTopTextureCoordinates = [0.5, 0.5];
    var cylinderSideTextureCoordinates = [];
    for (var i = 0; i <= segment; i++) {
        x = Math.cos(deltaTheta * i);
        z = Math.sin(deltaTheta * i);

        cylinderBotVertices.push(x, 0, z);
        cylinderBotNormals.push(0.0, -1.0, 0.0);
        cylinderBotTopTextureCoordinates.push((x + 1) / 2, (z + 1) / 2);

        cylinderSideVertices.push(x, 0, z);
        cylinderSideNormals.push(x, 0, z);
        cylinderSideTextureCoordinates.push(i / segment, 0.0);
        cylinderSideVertices.push(x, 1, z);
        cylinderSideNormals.push(x, 0, z);
        cylinderSideTextureCoordinates.push(i / segment, 1.0);

        cylinderTopVertices.push(x, 1, z);
        cylinderTopNormals.push(0.0, 1.0, 0.0);
    }
    cylinderVertexPositionBuffer = gl.createBuffer();
    cylinderVertexNormalBuffer = gl.createBuffer();
    cylinderTextureBuffer = gl.createBuffer();
    var cylinderVertices = cylinderBotVertices.concat(cylinderSideVertices).concat(cylinderTopVertices);
    var cylinderNormals = cylinderBotNormals.concat(cylinderSideNormals).concat(cylinderTopNormals);
    var cylinderTextureCoordinates = cylinderBotTopTextureCoordinates.concat(cylinderSideTextureCoordinates).concat(cylinderBotTopTextureCoordinates);
    gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinderVertices), gl.STATIC_DRAW);
    cylinderVertexPositionBuffer.itemSize = 3;
    cylinderVertexPositionBuffer.numItems = cylinderVertices.length / 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinderNormals), gl.STATIC_DRAW);
    cylinderVertexNormalBuffer.itemSize = 3;
    cylinderVertexNormalBuffer.numItems = cylinderNormals.length / 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, cylinderTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cylinderTextureCoordinates), gl.STATIC_DRAW);
    cylinderTextureBuffer.itemSize = 2;
    cylinderTextureBuffer.numItems = cylinderTextureCoordinates.length / 2;

    var cylinderIndices = [];
    //bot vertices
    for (var i = 2; i < cylinderBotVertices.length / 3; i++) {
        cylinderIndices.push(0, i - 1, i);
    }
    cylinderIndices.push(0, cylinderBotVertices.length / 3 - 1, 1);
    var offset = cylinderBotVertices.length / 3;
    //side vertices
    for (var i = 2; i < cylinderSideVertices.length / 3; i++) {
        cylinderIndices.push(offset + i - 2, offset + i - 1, offset + i);
    }
    cylinderIndices.push(offset + cylinderSideVertices.length / 3 - 2, offset + cylinderSideVertices.length / 3 - 1, offset);
    cylinderIndices.push(offset + cylinderSideVertices.length / 3 - 1, offset, offset + 1);
    offset += cylinderSideVertices.length / 3;
    for (var i = 2; i < cylinderTopVertices.length / 3; i++) {
        cylinderIndices.push(offset, offset + i - 1, offset + i);
    }
    cylinderIndices.push(offset, offset + cylinderTopVertices.length / 3 - 1, offset + 1);
    //console.log(cylinderVertices.length);
    //console.log(cylinderIndices);

    cylinderVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cylinderIndices), gl.STATIC_DRAW);
    cylinderVertexIndexBuffer.itemSize = 1;
    cylinderVertexIndexBuffer.numItems = cylinderIndices.length;

    //DEFINING SPHERE
    var latitudeBands = 30;
    var longitudeBands = 30;
    var radius = 0.5;
    var vertexPositionData = [];
    var normalData = [];
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);
            normalData.push(-x);
            normalData.push(-y);
            normalData.push(-z);
            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);
        }
    }
    var indexData = [];
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);
            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = normalData.length / 3;
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = vertexPositionData.length / 3;
    sphereVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
    sphereVertexIndexBuffer.itemSize = 1;
    sphereVertexIndexBuffer.numItems = indexData.length;

    //don't use textures for spheres. Thus, mark all as 0
    sphereTextureBuffer = gl.createBuffer();
    var sphereTextures = [];
    for (var i = 0; i < normalData.length / 3; i++) {
        sphereTextures.push(0.0, 0.0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereTextures), gl.STATIC_DRAW);
    sphereTextureBuffer.itemSize = 2;
    sphereTextureBuffer.numItems = normalData.length / 3;

    shadowFrameBuffer = createFrameBufferObject(gl, 512, 512);
}

function initializeAtrributes() {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shadowMapShaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexTextureAttribute, cubeTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
}

function setupToDrawCube(shadow) {
    if (shadow) {
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
        gl.vertexAttribPointer(shadowMapShaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexTextureAttribute, cubeTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    }
}

function setupToDrawCubeInsides(shadow) {
    if (shadow) {
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
        gl.vertexAttribPointer(shadowMapShaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeInsidesVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeInsidesVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeTextureBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexTextureAttribute, cubeTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    }
}

function setupToDrawCylinder(shadow) {
    if (shadow) {
        gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexPositionBuffer);
        gl.vertexAttribPointer(shadowMapShaderProgram.vertexPositionAttribute, cylinderVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderVertexIndexBuffer);
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cylinderVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cylinderVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cylinderVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cylinderTextureBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexTextureAttribute, cylinderTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderVertexIndexBuffer);
    }
}

function setupToDrawSphere(shadow) {
    if (shadow) {
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
        gl.vertexAttribPointer(shadowMapShaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, sphereTextureBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexTextureAttribute, sphereTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    }
}

function setupMaterialBrass() {
    gl.uniform3f(shaderProgram.uMaterialAmbientColorUniform, 0.329412, 0.223529, 0.027451);
    gl.uniform3f(shaderProgram.uMaterialDiffuseColorUniform, 0.780392, 0.568627, 0.113725);
    gl.uniform3f(shaderProgram.uMaterialSpecularColorUniform, 0.992157, 0.941176, 0.807843);
    gl.uniform1f(shaderProgram.uMaterialShininessUniform, 27.8974);
}

function setupMaterialBronze() {
    gl.uniform3f(shaderProgram.uMaterialAmbientColorUniform, 0.2125, 0.1275, 0.054);
    gl.uniform3f(shaderProgram.uMaterialDiffuseColorUniform, 0.714, 0.4284, 0.18144);
    gl.uniform3f(shaderProgram.uMaterialSpecularColorUniform, 0.393548, 0.271906, 0.166721);
    gl.uniform1f(shaderProgram.uMaterialShininessUniform, 25.6);
}

function setupMaterialChrome() {
    gl.uniform3f(shaderProgram.uMaterialAmbientColorUniform, 0.25, 0.25, 0.25);
    gl.uniform3f(shaderProgram.uMaterialDiffuseColorUniform, 0.4, 0.4, 0.4774597);
    gl.uniform3f(shaderProgram.uMaterialSpecularColorUniform, 0.774597, 0.271906, 0.774597);
    gl.uniform1f(shaderProgram.uMaterialShininessUniform, 76.8);
}

function setupMaterial(material, shadow) {
    if (!shadow) {
        gl.uniform1i(shaderProgram.useMaterialUniform, true);
        if (material == "brass") {
            setupMaterialBrass();
        } else if (material == "bronze") {
            setupMaterialBronze();
        } else if (material == "chrome") {
            setupMaterialChrome();
        } else if (material == "none") {
            setupMaterialChrome();
            gl.uniform1i(shaderProgram.useMaterialUniform, false);
        }
    }
}

function chooseTexture(i, shadow) {
    if (!shadow) gl.uniform1i(gl.getUniformLocation(shaderProgram, "thetexture"), i);
}


var animating = 1;

var lightSourceNode;
var roomNode;

// Spider
var baseSpiderBodyNode; var baseSpiderAngle = 0;
var firstSpiderRightLegNode; var firstSpiderRightLegAngle = 0;
var secondSpiderRightLegNode; var secondSpiderRightLegAngle = 0;
var thirdSpiderRightLegNode; var thirdSpiderRightLegAngle = 0;
var fourthSpiderRightLegNode; var fourthSpiderRightLegAngle = 0;
var firstSpiderLeftLegNode; var firstSpiderLeftLegAngle = 0;
var secondSpiderLeftLegNode; var secondSpiderLeftLegAngle = 0;
var thirdSpiderLeftLegNode; var thirdSpiderLeftLegAngle = 0;
var fourthSpiderLeftLegNode; var fourthSpiderLeftLegAngle = 0;
var spiderLegDirection = 1;

// Bird
var birdHeadNode; var birdHeadAngle = 0; var birdHeadDirection = 1;
var birdNeckNode; var birdNeckAngle = 0; var birdNeckDirection = 1;
var birdBodyNode; var birdBodyAngle = 0; var birdBodyDirection = 1;
var birdRightWingNode; var birdRightWingAngle = 0; var birdRightWingDirection = 1;
var birdLeftWingNode; var birdLeftWingAngle = 0; var birdLeftWingDirection = 1;
var birdUpperRightLegNode; var birdUpperRightLegAngle = 0; var birdUpperRightLegDirection = 1;
var birdUpperLeftLegNode; var birdUpperLeftLegAngle = 0; var birdUpperLeftLegDirection = 1;
var birdLowerRightLegNode; var birdLowerRightLegAngle = 0; var birdLowerRightLegDirection = 1;
var birdLowerLeftLegNode; var birdLowerLeftLegAngle = 0; var birdLowerLeftLegDirection = 1;
var birdRightFootNode; var birdRightFootAngle = 0; var birdRightFootDirection = 1;
var birdLeftFootNode; var birdLeftFootAngle = 0; var birdLeftFootDirection = 1;

// Claw
var clawBaseNode; var clawBaseRotation = 0; var clawBaseDirection = 1;
var clawBodyNode; 
var clawSecondBodyNode; var clawArmTranslation = 0; var clawArmDirection = 1;
var clawFingerBaseNode;
var clawFirstFingerUpperNode; var clawFirstUpperFingerRotation = 0; var clawFirstDirection = 1;
var clawSecondFingerUpperNode; var clawSecondUpperFingerRotation = 0; var clawSecondDirection = 1;
var clawFirstFingerLowerNode;
var clawSecondFingerLowerNode;

// Table
var tableBodyNode; var tableBodyAngle = 0;
var tableFirstLegNode;
var tableSecondLegNode;
var tableThirdLegNode;
var tableFourthLegNode;

// Piston
var pistonBodyNode; var pistonBodyAngle = 0;
var pistonPillarNode; var pistonPillarTranslation = 0; var pistonPillarDirection = 1;
var pistonTopNode;

function drawLightSource(shadow) {
    mvPushMatrix();
    //item specific modifications
    //draw
    setupToDrawSphere(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(1, shadow);
    setupMaterial("bronze", shadow);
    gl.drawElements(gl.TRIANGLES, sphereVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawRoom(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [10.0, 5.0, 30.0]);
    //draw
    setupToDrawCubeInsides(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(1, shadow);
    setupMaterial(roomMaterial, shadow);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

/**
 * 
 * Functions to draw spider
 * 
 */
function drawSpiderBody(shadow) {
    mvPushMatrix();
    mat4.scale(mvMatrix, [0.5, 0.3, 1.5]);
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(6, shadow);
    setupMaterial(spiderMaterial, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawSpiderLeg(shadow) {
    mvPushMatrix();
    mat4.scale(mvMatrix, [0.5, 0.2, 0.2]);
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(6, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

/**
 * 
 * Functions to draw bird
 * 
 */
function drawBirdBody(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [1.2, 0.7, 0.8]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    setupMaterial(birdMaterial, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawBirdNeck(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [0.3, 1.0, 0.3]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawBirdHead(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [0.4, 0.2, 0.2]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawBirdWing(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [1.2, 0.1, 0.6]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawBirdUpperLeg(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [0.15, 0.7, 0.15]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawBirdLowerLeg(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [0.15, 0.4, 0.15]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawBirdFoot(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [0.1, 0.3, 0.15]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

/**
 * 
 * Functions to draw claw machine
 * 
 */
function drawClawBase(shadow) {
    mvPushMatrix();
    mat4.scale(mvMatrix, [1, 0.2, 1]);
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawClawBody(shadow) {
    mvPushMatrix();
    mat4.scale(mvMatrix, [0.3, 1, 0.3]);
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawClawSecondBody(shadow) {
    mvPushMatrix();
    mat4.scale(mvMatrix, [0.2, 1, 0.2]);
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawClawFingerBase(shadow) {
    mvPushMatrix();
    mat4.scale(mvMatrix, [0.5, 0.2, 0.5]);
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);   
}

function drawClawFinger(shadow) {
    mvPushMatrix();
    mat4.scale(mvMatrix, [0.1, 0.4, 0.1]);
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);   
}

/**
 * 
 * Functions to draw table
 * 
 */
function drawTableBody(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [4, 0.2, 2]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawTableLeg(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [0.2, 1, 0.2]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

/**
 * 
 * Functions to draw piston
 * 
 */
function drawPistonBody(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [0.6, 0.9, 0.9]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(8, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);
}

function drawPistonPillar(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [0.59, 0.2, 0.2]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);   
}

function drawPistonTop(shadow) {
    mvPushMatrix();
    //item specific modifications
    mat4.scale(mvMatrix, [0.15, 0.9, 0.9]);
    //draw
    setupToDrawCube(shadow);
    setMatrixUniforms(shadow);
    chooseTexture(2, shadow);
    gl.drawElements(objectDrawMode || gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix(shadow);   
}

function initObjectTree() {
    lightSourceNode = { "draw": drawLightSource, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(lightSourceNode.matrix, [document.getElementById("lightPositionX").value / 10.0, document.getElementById("lightPositionY").value / 10.0, document.getElementById("lightPositionZ").value / 10.0]);

    roomNode = { "draw": drawRoom, "matrix": mat4.identity(mat4.create()) };

    /**
     * Make Spider Node
     */
    baseSpiderBodyNode = { draw: drawSpiderBody, matrix: mat4.identity(mat4.create()) };
    mat4.translate(baseSpiderBodyNode.matrix, [-4, -4, 5]);
    mat4.rotate(baseSpiderBodyNode.matrix, baseSpiderAngle, [0, 1, 0]);

    firstSpiderRightLegNode = { draw: drawSpiderLeg, matrix: mat4.identity(mat4.create()) };
    mat4.translate(firstSpiderRightLegNode.matrix, [-0.5, -0.15, 1])
    mat4.rotate(firstSpiderRightLegNode.matrix, firstSpiderRightLegAngle, [0, 1, 0])
    mat4.translate(firstSpiderRightLegNode.matrix, [-0.5, 0, 0])

    secondSpiderRightLegNode = { draw: drawSpiderLeg, matrix: mat4.identity(mat4.create()) };
    mat4.translate(secondSpiderRightLegNode.matrix, [-0.5, -0.15, 0.33])
    mat4.rotate(secondSpiderRightLegNode.matrix, secondSpiderRightLegAngle, [0, 1, 0])
    mat4.translate(secondSpiderRightLegNode.matrix, [-0.5, 0, 0])

    thirdSpiderRightLegNode = { draw: drawSpiderLeg, matrix: mat4.identity(mat4.create()) };
    mat4.translate(thirdSpiderRightLegNode.matrix, [-0.5, -0.15, -0.33])
    mat4.rotate(thirdSpiderRightLegNode.matrix, thirdSpiderRightLegAngle, [0, 1, 0])
    mat4.translate(thirdSpiderRightLegNode.matrix, [-0.5, 0, 0])

    fourthSpiderRightLegNode = { draw: drawSpiderLeg, matrix: mat4.identity(mat4.create()) };
    mat4.translate(fourthSpiderRightLegNode.matrix, [-0.5, -0.15, -1])
    mat4.rotate(fourthSpiderRightLegNode.matrix, fourthSpiderRightLegAngle, [0, 1, 0])
    mat4.translate(fourthSpiderRightLegNode.matrix, [-0.5, 0, 0])

    firstSpiderLeftLegNode = { draw: drawSpiderLeg, matrix: mat4.identity(mat4.create()) };
    mat4.translate(firstSpiderLeftLegNode.matrix, [0.5, -0.15, 1])
    mat4.rotate(firstSpiderLeftLegNode.matrix, firstSpiderLeftLegAngle, [0, 1, 0])
    mat4.translate(firstSpiderLeftLegNode.matrix, [0.5, 0, 0])

    secondSpiderLeftLegNode = { draw: drawSpiderLeg, matrix: mat4.identity(mat4.create()) };
    mat4.translate(secondSpiderLeftLegNode.matrix, [0.5, -0.15, 0.33])
    mat4.rotate(secondSpiderLeftLegNode.matrix, secondSpiderLeftLegAngle, [0, 1, 0])
    mat4.translate(secondSpiderLeftLegNode.matrix, [0.5, 0, 0])

    thirdSpiderLeftLegNode = { draw: drawSpiderLeg, matrix: mat4.identity(mat4.create()) };
    mat4.translate(thirdSpiderLeftLegNode.matrix, [0.5, -0.15, -0.33])
    mat4.rotate(thirdSpiderLeftLegNode.matrix, thirdSpiderLeftLegAngle, [0, 1, 0])
    mat4.translate(thirdSpiderLeftLegNode.matrix, [0.5, 0, 0])

    fourthSpiderLeftLegNode = { draw: drawSpiderLeg, matrix: mat4.identity(mat4.create()) };
    mat4.translate(fourthSpiderLeftLegNode.matrix, [0.5, -0.15, -1])
    mat4.rotate(fourthSpiderLeftLegNode.matrix, fourthSpiderLeftLegAngle, [0, 1, 0])
    mat4.translate(fourthSpiderLeftLegNode.matrix, [0.5, 0, 0])

    /**
     * Make Bird Node
     */
    birdBodyNode = { "draw": drawBirdBody, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdBodyNode.matrix, [5.0, -2.5, 3.0]);
    mat4.rotate(birdBodyNode.matrix, birdBodyAngle, [0.0, 1.0, 0.0]);

    birdNeckNode = { "draw": drawBirdNeck, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdNeckNode.matrix, [-1.5, 0.3, 0.0]);
    mat4.rotate(birdNeckNode.matrix, birdNeckAngle / 3, [0.0, 0.0, 1.0]);

    birdHeadNode = { "draw": drawBirdHead, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdHeadNode.matrix, [-0.7, 0.85, 0.0]);

    birdRightWingNode = { "draw": drawBirdWing, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdRightWingNode.matrix, [0.0, 0.7, -1.3]);
    mat4.rotate(birdRightWingNode.matrix, (birdRightWingAngle - 20) / 3, [-1.0, 0.0, 0.0]);

    birdLeftWingNode = { "draw": drawBirdWing, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdLeftWingNode.matrix, [0.0, 0.7, 1.3]);
    mat4.rotate(birdLeftWingNode.matrix, (birdLeftWingAngle - 20) / 3, [1.0, 0.0, 0.0]);

    birdUpperRightLegNode = { "draw": drawBirdUpperLeg, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdUpperRightLegNode.matrix, [0, -1.1, -0.9]);
    mat4.rotate(birdUpperRightLegNode.matrix, ((birdUpperRightLegAngle + 30) * Math.PI) / 180, [0.0, 0.0, 1.0]);

    birdLowerRightLegNode = { "draw": drawBirdLowerLeg, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdLowerRightLegNode.matrix, [-0.3, -0.8, 0.0]);
    mat4.rotate(birdLowerRightLegNode.matrix, ((birdLowerRightLegAngle - 60) * Math.PI) / 180, [0.0, 0.0, 1.0]);

    birdUpperLeftLegNode = { "draw": drawBirdUpperLeg, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdUpperLeftLegNode.matrix, [0, -1.1, 0.9]);
    mat4.rotate(birdUpperLeftLegNode.matrix, ((birdUpperLeftLegAngle + 30) * Math.PI) / 180, [0.0, 0.0, 1.0]);

    birdLowerLeftLegNode = { "draw": drawBirdLowerLeg, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdLowerLeftLegNode.matrix, [-0.3, -0.8, 0.0]);
    mat4.rotate(birdLowerLeftLegNode.matrix, ((birdLowerLeftLegAngle - 60) * Math.PI) / 180, [0.0, 0.0, 1.0]);

    birdRightFootNode = { "draw": drawBirdFoot, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdRightFootNode.matrix, [-0.2, -0.48, 0.0]);
    mat4.rotate(birdRightFootNode.matrix, ((birdRightFootAngle - 60) * Math.PI) / 180, [0.0, 0.0, 1.0]);

    birdLeftFootNode = { "draw": drawBirdFoot, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(birdLeftFootNode.matrix, [-0.2, -0.48, 0.0]);
    mat4.rotate(birdLeftFootNode.matrix, ((birdRightFootAngle - 60) * Math.PI) / 180, [0.0, 0.0, 1.0]);

    /**
     * Create Claw Node
     */
    clawBaseNode = { draw: drawClawBase, matrix: mat4.identity(mat4.create())};
    mat4.translate(clawBaseNode.matrix, [7, 4, -3])

    clawBodyNode = { draw: drawClawBody, matrix: mat4.identity(mat4.create())};
    mat4.translate(clawBodyNode.matrix, [0, -1, 0])

    clawSecondBodyNode = { draw: drawClawSecondBody, matrix: mat4.identity(mat4.create())};
    mat4.translate(clawSecondBodyNode.matrix, [0, clawArmTranslation, 0])

    clawFingerBaseNode = { draw: drawClawFingerBase, matrix: mat4.identity(mat4.create())};
    mat4.translate(clawFingerBaseNode.matrix, [0, -1, 0])

    clawFirstFingerUpperNode = { draw: drawClawFinger, matrix: mat4.identity(mat4.create())};
    mat4.rotate(clawFirstFingerUpperNode.matrix, clawFirstUpperFingerRotation, [0, 0, -1])
    mat4.translate(clawFirstFingerUpperNode.matrix, [-0.3, -0.5, 0])

    clawSecondFingerUpperNode = { draw: drawClawFinger, matrix: mat4.identity(mat4.create())};
    mat4.rotate(clawSecondFingerUpperNode.matrix, clawSecondUpperFingerRotation, [0, 0, 1])
    mat4.translate(clawSecondFingerUpperNode.matrix, [0.3, -0.5, 0])

    clawFirstFingerLowerNode = { draw: drawClawFinger, matrix: mat4.identity(mat4.create())};
    mat4.translate(clawFirstFingerLowerNode.matrix, [-0.3, 0, 0])
    mat4.rotate(clawFirstFingerLowerNode.matrix, 45 * Math.PI / 180, [0, 0, 1])
    mat4.translate(clawFirstFingerLowerNode.matrix, [0, -0.8, 0])

    clawSecondFingerLowerNode = { draw: drawClawFinger, matrix: mat4.identity(mat4.create())};
    mat4.translate(clawSecondFingerLowerNode.matrix, [0.3, 0, 0])
    mat4.rotate(clawSecondFingerLowerNode.matrix, 45 * Math.PI / 180, [0,  0, -1])
    mat4.translate(clawSecondFingerLowerNode.matrix, [0, -0.8, 0])

    /**
     * Create Table Node
     */
    tableBodyNode = { "draw": drawTableBody, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(tableBodyNode.matrix, [-4, -2.5, -3]);
    mat4.rotate(tableBodyNode.matrix, tableBodyAngle, [0.0, 1.0, 0.0]);

    tableFirstLegNode = { "draw": drawTableLeg, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(tableFirstLegNode.matrix, [3.2, -1, -1.5]);

    tableSecondLegNode = { "draw": drawTableLeg, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(tableSecondLegNode.matrix, [-3.2, -1, -1.5]);

    tableThirdLegNode = { "draw": drawTableLeg, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(tableThirdLegNode.matrix, [-3.2, -1, 1.5]);

    tableFourthLegNode = { "draw": drawTableLeg, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(tableFourthLegNode.matrix, [3.2, -1, 1.5]);

    /**
     * Make Piston Node
     */
    pistonBodyNode = { "draw": drawPistonBody, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(pistonBodyNode.matrix, [-6, 2.2, -1]);
    mat4.rotate(pistonBodyNode.matrix, pistonBodyAngle, [0.0, 1.0, 0.0]);

    pistonPillarNode = { "draw": drawPistonPillar, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(pistonPillarNode.matrix, [-pistonPillarTranslation, 0, 0]);

    pistonTopNode = { "draw": drawPistonTop, "matrix": mat4.identity(mat4.create()) };
    mat4.translate(pistonTopNode.matrix, [0.75, 0, 0]);

    /**
     * Create Spider Hiearchical Model
     */
    baseSpiderBodyNode.child = firstSpiderRightLegNode;
    firstSpiderRightLegNode.sibling = secondSpiderRightLegNode;
    secondSpiderRightLegNode.sibling = thirdSpiderRightLegNode;
    thirdSpiderRightLegNode.sibling = fourthSpiderRightLegNode;
    fourthSpiderRightLegNode.sibling = firstSpiderLeftLegNode;
    firstSpiderLeftLegNode.sibling = secondSpiderLeftLegNode;
    secondSpiderLeftLegNode.sibling = thirdSpiderLeftLegNode;
    thirdSpiderLeftLegNode.sibling = fourthSpiderLeftLegNode;

    /**
     * Create Bird Hiearchical Model
     */
    baseSpiderBodyNode.sibling = birdBodyNode;
    birdBodyNode.child = birdNeckNode;
    birdNeckNode.child = birdHeadNode;
    birdNeckNode.sibling = birdRightWingNode;
    birdRightWingNode.sibling = birdLeftWingNode;
    birdLeftWingNode.sibling = birdUpperRightLegNode;
    birdUpperRightLegNode.child = birdLowerRightLegNode;
    birdUpperRightLegNode.sibling = birdUpperLeftLegNode;
    birdUpperLeftLegNode.child = birdLowerLeftLegNode;
    birdLowerRightLegNode.child = birdRightFootNode;
    birdLowerLeftLegNode.child = birdLeftFootNode;

    /**
     * Create Claw Hierarhical Model
     */
    birdBodyNode.sibling = clawBaseNode;
    clawBaseNode.child = clawBodyNode;
    clawBodyNode.child = clawSecondBodyNode;
    clawSecondBodyNode.child = clawFingerBaseNode;
    clawFingerBaseNode.child = clawFirstFingerUpperNode;
    clawFirstFingerUpperNode.sibling = clawSecondFingerUpperNode;
    clawFirstFingerUpperNode.child = clawFirstFingerLowerNode;
    clawSecondFingerUpperNode.child = clawSecondFingerLowerNode;
    
    /**
     * Create Table Hierarhical Model
     */
    clawBaseNode.sibling = tableBodyNode;
    tableBodyNode.child = tableFirstLegNode;
    tableFirstLegNode.sibling = tableSecondLegNode;
    tableSecondLegNode.sibling = tableThirdLegNode;
    tableThirdLegNode.sibling = tableFourthLegNode;

    /**
     * Create Piston Hiearchical Model
     */
    tableFourthLegNode.child = pistonBodyNode;
    pistonBodyNode.child = pistonPillarNode;
    pistonPillarNode.child = pistonTopNode
}

function traverse(node, shadow) {
    mvPushMatrix();
    //modifications
    mat4.multiply(mvMatrix, node.matrix);
    //draw
    node.draw(shadow);
    if ("child" in node) traverse(node.child, shadow);
    mvPopMatrix(shadow);
    if ("sibling" in node) traverse(node.sibling, shadow);
}

var shadowMapLookAtMatrix = mat4.create();
var shadowMapPerspectiveMatrix = mat4.create();
var shadowMapTransform = mat4.create();

// a representation of vector 3
// taken from http://learnwebgl.brown37.net/lib/learn_webgl_vector3.js
var Vector3 = function () {

    var self = this;

    /** ---------------------------------------------------------------------
    * Create a new 3-component vector.
    * @param dx Number The change in x of the vector.
    * @param dy Number The change in y of the vector.
    * @param dz Number The change in z of the vector.
    * @return Float32Array A new 3-component vector
    */
    self.create = function (dx, dy, dz) {
        var v = new Float32Array(3);
        v[0] = 0;
        v[1] = 0;
        v[2] = 0;
        if (arguments.length >= 1) { v[0] = dx; }
        if (arguments.length >= 2) { v[1] = dy; }
        if (arguments.length >= 3) { v[2] = dz; }
        return v;
    };

    /** ---------------------------------------------------------------------
    * Create a new 3-component vector and set its components equal to an existing vector.
    * @param from Float32Array An existing vector.
    * @return Float32Array A new 3-component vector with the same values as "from"
    */
    self.createFrom = function (from) {
        var v = new Float32Array(3);
        v[0] = from[0];
        v[1] = from[1];
        v[2] = from[2];
        return v;
    };

    /** ---------------------------------------------------------------------
    * Create a vector using two existing points.
    * @param tail Float32Array A 3-component point.
    * @param head Float32Array A 3-component point.
    * @return Float32Array A new 3-component vector defined by 2 points
    */
    self.createFrom2Points = function (tail, head) {
        var v = new Float32Array(3);
        self.subtract(v, head, tail);
        return v;
    };

    /** ---------------------------------------------------------------------
    * Copy a 3-component vector into another 3-component vector
    * @param to Float32Array A 3-component vector that you want changed.
    * @param from Float32Array A 3-component vector that is the source of data
    * @returns Float32Array The "to" 3-component vector
    */
    self.copy = function (to, from) {
        to[0] = from[0];
        to[1] = from[1];
        to[2] = from[2];
        return to;
    };

    /** ---------------------------------------------------------------------
    * Set the components of a 3-component vector.
    * @param v Float32Array The vector to change.
    * @param dx Number The change in x of the vector.
    * @param dy Number The change in y of the vector.
    * @param dz Number The change in z of the vector.
    */
    self.set = function (v, dx, dy, dz) {
        v[0] = dx;
        v[1] = dy;
        v[2] = dz;
    };

    /** ---------------------------------------------------------------------
    * Calculate the length of a vector.
    * @param v Float32Array A 3-component vector.
    * @return Number The length of a vector
    */
    self.length = function (v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    };

    /** ---------------------------------------------------------------------
    * Make a vector have a length of 1.
    * @param v Float32Array A 3-component vector.
    * @return Float32Array The input vector normalized to unit length. Or null if the vector is zero length.
    */
    self.normalize = function (v) {
        var length, percent;

        length = self.length(v);
        if (Math.abs(length) < 0.0000001) {
            return null; // Invalid vector
        }

        percent = 1.0 / length;
        v[0] = v[0] * percent;
        v[1] = v[1] * percent;
        v[2] = v[2] * percent;
        return v;
    };

    /** ---------------------------------------------------------------------
    * Add two vectors:  result = V0 + v1
    * @param result Float32Array A 3-component vector.
    * @param v0 Float32Array A 3-component vector.
    * @param v1 Float32Array A 3-component vector.
    */
    self.add = function (result, v0, v1) {
        result[0] = v0[0] + v1[0];
        result[1] = v0[1] + v1[1];
        result[2] = v0[2] + v1[2];
    };

    /** ---------------------------------------------------------------------
    * Subtract two vectors:  result = v0 - v1
    * @param result Float32Array A 3-component vector.
    * @param v0 Float32Array A 3-component vector.
    * @param v1 Float32Array A 3-component vector.
    */
    self.subtract = function (result, v0, v1) {
        result[0] = v0[0] - v1[0];
        result[1] = v0[1] - v1[1];
        result[2] = v0[2] - v1[2];
    };

    /** ---------------------------------------------------------------------
    * Scale a vector:  result = s * v0
    * @param result Float32Array A 3-component vector.
    * @param v0 Float32Array A 3-component vector.
    * @param s Number A scale factor.
    */
    self.scale = function (result, v0, s) {
        result[0] = v0[0] * s;
        result[1] = v0[1] * s;
        result[2] = v0[2] * s;
    };

    /** ---------------------------------------------------------------------
    * Calculate the cross product of 2 vectors: result = v0 x v1 (order matters)
    * @param result Float32Array A 3-component vector.
    * @param v0 Float32Array A 3-component vector.
    * @param v1 Float32Array A 3-component vector.
    */
    self.crossProduct = function (result, v0, v1) {
        result[0] = v0[1] * v1[2] - v0[2] * v1[1];
        result[1] = v0[2] * v1[0] - v0[0] * v1[2];
        result[2] = v0[0] * v1[1] - v0[1] * v1[0];
    };

    /** ---------------------------------------------------------------------
    * Calculate the dot product of 2 vectors
    * @param v0 Float32Array A 3-component vector.
    * @param v1 Float32Array A 3-component vector.
    * @return Number Float32Array The dot product of v0 and v1
    */
    self.dotProduct = function (v0, v1) {
        return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
    };

    /** ---------------------------------------------------------------------
    * Print a vector on the console.
    * @param name String A description of the vector to be printed.
    * @param v Float32Array A 3-component vector.
    */
    self.print = function (name, v) {
        var maximum, order, digits;

        maximum = Math.max(v[0], v[1], v[2]);
        order = Math.floor(Math.log(maximum) / Math.LN10 + 0.000000001);
        digits = (order <= 0) ? 5 : (order > 5) ? 0 : (5 - order);

        console.log("Vector3: " + name + ": " + v[0].toFixed(digits) + " "
            + v[1].toFixed(digits) + " "
            + v[2].toFixed(digits));
    };
};

var V = new Vector3();
var center = V.create();
var eye = V.create();
var up = V.create();
var u = V.create();
var v = V.create();
var n = V.create();

// a method to generate lookat matrix
// taken from http://learnwebgl.brown37.net/lib/learn_webgl_matrix.js because mat4.lookat seems buggy
lookAt = function (M, eye_x, eye_y, eye_z, center_x, center_y, center_z, up_dx, up_dy, up_dz) {

    // Local coordinate system for the camera:
    //   u maps to the x-axis
    //   v maps to the y-axis
    //   n maps to the z-axis

    V.set(center, center_x, center_y, center_z);
    V.set(eye, eye_x, eye_y, eye_z);
    V.set(up, up_dx, up_dy, up_dz);

    V.subtract(n, eye, center);  // n = eye - center
    V.normalize(n);

    V.crossProduct(u, up, n);
    V.normalize(u);

    V.crossProduct(v, n, u);
    V.normalize(v);

    var tx = - V.dotProduct(u, eye);
    var ty = - V.dotProduct(v, eye);
    var tz = - V.dotProduct(n, eye);

    // Set the camera matrix
    M[0] = u[0]; M[4] = u[1]; M[8] = u[2]; M[12] = tx;
    M[1] = v[0]; M[5] = v[1]; M[9] = v[2]; M[13] = ty;
    M[2] = n[0]; M[6] = n[1]; M[10] = n[2]; M[14] = tz;
    M[3] = 0; M[7] = 0; M[11] = 0; M[15] = 1;
};

//draws shadowmap for the side of the texture
//0: positive x, ..., 5: negative z
function drawShadowMap(side) {
    var centers = [
        1.0, 0.0, 0.0, //positive x
        -1.0, 0.0, 0.0, //negative x
        0.0, 1.0, 0.0, //positive y
        0.0, -1.0, 0.0, //negative y
        0.0, 0.0, 1.0, //positive z
        0.0, 0.0, -1.0, //negative z
    ];

    var upVectors = [
        0.0, -1.0, 0.0, //positive x
        0.0, -1.0, 0.0, //negative x
        0.0, 0.0, 1.0, //positive y
        0.0, 0.0, -1.0, //negative y
        0.0, -1.0, 0.0, //positive z
        0.0, -1.0, 0.0, //negative z
    ];
    gl.useProgram(shadowMapShaderProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFrameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + side, shadowFrameBuffer.depthBuffer, 0);

    gl.viewport(0, 0, shadowFrameBuffer.width, shadowFrameBuffer.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    shadowMapLookAtMatrix = mat4.create();
    lookAt(shadowMapLookAtMatrix,
        parseFloat(document.getElementById("lightPositionX").value / 10.0),
        parseFloat(document.getElementById("lightPositionY").value / 10.0),
        parseFloat(document.getElementById("lightPositionZ").value / 10.0),
        parseFloat(document.getElementById("lightPositionX").value / 10.0) + centers[side * 3],
        parseFloat(document.getElementById("lightPositionY").value / 10.0) + centers[side * 3 + 1],
        parseFloat(document.getElementById("lightPositionZ").value / 10.0) + centers[side * 3 + 2],
        upVectors[side * 3],
        upVectors[side * 3 + 1],
        upVectors[side * 3 + 2]);
    mat4.perspective(90, shadowFrameBuffer.width / shadowFrameBuffer.height, 0.1, 100.0, shadowMapTransform);
    mat4.multiply(shadowMapTransform, shadowMapLookAtMatrix);
    mat4.set(shadowMapTransform, pMatrix);

    gl.uniform3f(
        shadowMapShaderProgram.pointLightingLocationUniform,
        parseFloat(document.getElementById("lightPositionX").value / 10.0),
        parseFloat(document.getElementById("lightPositionY").value / 10.0),
        parseFloat(document.getElementById("lightPositionZ").value / 10.0)
    );
    gl.uniform1f(shadowMapShaderProgram.uFarPlaneUniform, 100.0);

    mat4.identity(mvMatrix);
    traverse(roomNode, true);
    mat4.translate(mvMatrix, [0, 0, -20]);
    traverse(baseSpiderBodyNode, true);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

var lookAtMatrix;
function drawScene() {
    lookAtMatrix = mat4.create();
    gl.useProgram(shaderProgram);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pMatrix = mat4.create();
    lookAt(lookAtMatrix,
        0.0, 0.0, 0.0,
        0.0, 0.0, -10.0,
        0.0, 1.0, 0.0);
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.multiply(pMatrix, lookAtMatrix);

    gl.uniform1i(shaderProgram.useLightingUniform, document.getElementById("lighting").checked);
    gl.uniform1i(shaderProgram.useTextureUniform, document.getElementById("texture").checked);

    gl.uniform3f(
        shaderProgram.ambientColorUniform,
        parseFloat(document.getElementById("ambientR").value),
        parseFloat(document.getElementById("ambientG").value),
        parseFloat(document.getElementById("ambientB").value)
    );
    gl.uniform3f(
        shaderProgram.pointLightingLocationUniform,
        parseFloat(document.getElementById("lightPositionX").value / 10.0),
        parseFloat(document.getElementById("lightPositionY").value / 10.0),
        parseFloat(document.getElementById("lightPositionZ").value / 10.0)
    );
    gl.uniform3f(
        shaderProgram.pointLightingDiffuseColorUniform,
        parseFloat(document.getElementById("pointR").value),
        parseFloat(document.getElementById("pointG").value),
        parseFloat(document.getElementById("pointB").value)
    );
    gl.uniform3f(
        shaderProgram.pointLightingSpecularColorUniform,
        parseFloat(document.getElementById("pointR").value),
        parseFloat(document.getElementById("pointG").value),
        parseFloat(document.getElementById("pointB").value)
    );

    gl.activeTexture(gl.TEXTURE31);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowFrameBuffer.depthBuffer);
    gl.uniform1i(shaderProgram.shadowMapUniform, 31);

    gl.uniform1f(shaderProgram.uFarPlaneUniform, 100.0);

    mat4.identity(mvMatrix);
    traverse(lightSourceNode, false);
    traverse(roomNode, false);

    mat4.translate(mvMatrix, [0, 0, -20]);
    traverse(baseSpiderBodyNode, false);

}

function animate() {
    if (animating) {
        //var update = (0.05 * Math.PI * (timeNow - lastTime)/ 180); //use elapsed time, which is faulty on changing tabs
        var update = (0.05 * Math.PI * 10 / 180);

        // Spider
        baseSpiderAngle = (baseSpiderAngle + update) % (2 * Math.PI);
        document.getElementById("baseSpiderRotationSlider").value = baseSpiderAngle * 180 / (Math.PI);

        firstSpiderRightLegAngle += 0.5 * update * spiderLegDirection;
        if (firstSpiderRightLegAngle < -Math.PI / 6 && spiderLegDirection == -1) spiderLegDirection *= -1;
        if (firstSpiderRightLegAngle > Math.PI / 6 && spiderLegDirection == 1) spiderLegDirection *= -1;
        document.getElementById("firstRightSpiderRotationSlider").value = firstSpiderRightLegAngle * 180 / (Math.PI);

        secondSpiderRightLegAngle += 0.5 * update * spiderLegDirection;
        if (secondSpiderRightLegAngle < -Math.PI / 6 && spiderLegDirection == -1) spiderLegDirection *= -1;
        if (secondSpiderRightLegAngle > Math.PI / 6 && spiderLegDirection == 1) spiderLegDirection *= -1;
        document.getElementById("secondRightSpiderRotationSlider").value = secondSpiderRightLegAngle * 180 / (Math.PI);

        thirdSpiderRightLegAngle += 0.5 * update * spiderLegDirection;
        if (thirdSpiderRightLegAngle < -Math.PI / 6 && spiderLegDirection == -1) spiderLegDirection *= -1;
        if (thirdSpiderRightLegAngle > Math.PI / 6 && spiderLegDirection == 1) spiderLegDirection *= -1;
        document.getElementById("thirdRightSpiderRotationSlider").value = thirdSpiderRightLegAngle * 180 / (Math.PI);

        fourthSpiderRightLegAngle += 0.5 * update * spiderLegDirection;
        if (fourthSpiderRightLegAngle < -Math.PI / 6 && spiderLegDirection == -1) spiderLegDirection *= -1;
        if (fourthSpiderRightLegAngle > Math.PI / 6 && spiderLegDirection == 1) spiderLegDirection *= -1;
        document.getElementById("fourthRightSpiderRotationSlider").value = fourthSpiderRightLegAngle * 180 / (Math.PI);

        firstSpiderLeftLegAngle += 0.5 * update * spiderLegDirection;
        if (firstSpiderLeftLegAngle < -Math.PI / 6 && spiderLegDirection == -1) spiderLegDirection *= -1;
        if (firstSpiderLeftLegAngle > Math.PI / 6 && spiderLegDirection == 1) spiderLegDirection *= -1;
        document.getElementById("firstLeftSpiderRotationSlider").value = firstSpiderLeftLegAngle * 180 / (Math.PI);

        secondSpiderLeftLegAngle += 0.5 * update * spiderLegDirection;
        if (secondSpiderLeftLegAngle < -Math.PI / 6 && spiderLegDirection == -1) spiderLegDirection *= -1;
        if (secondSpiderLeftLegAngle > Math.PI / 6 && spiderLegDirection == 1) spiderLegDirection *= -1;
        document.getElementById("secondLeftSpiderRotationSlider").value = secondSpiderLeftLegAngle * 180 / (Math.PI);

        thirdSpiderLeftLegAngle += 0.5 * update * spiderLegDirection;
        if (thirdSpiderLeftLegAngle < -Math.PI / 6 && spiderLegDirection == -1) spiderLegDirection *= -1;
        if (thirdSpiderLeftLegAngle > Math.PI / 6 && spiderLegDirection == 1) spiderLegDirection *= -1;
        document.getElementById("thirdLeftSpiderRotationSlider").value = thirdSpiderLeftLegAngle * 180 / (Math.PI);

        fourthSpiderLeftLegAngle += 0.5 * update * spiderLegDirection;
        if (fourthSpiderLeftLegAngle < -Math.PI / 6 && spiderLegDirection == -1) spiderLegDirection *= -1;
        if (fourthSpiderLeftLegAngle > Math.PI / 6 && spiderLegDirection == 1) spiderLegDirection *= -1;
        document.getElementById("fourthLeftSpiderRotationSlider").value = fourthSpiderLeftLegAngle * 180 / (Math.PI);

        // Bird
        birdBodyAngle = (birdBodyAngle + update) % (2 * Math.PI);
        document.getElementById("birdBodyRotationSlider").value = birdBodyAngle * 180 / (Math.PI);

        birdNeckAngle += update * birdNeckDirection;
        if (birdNeckAngle < 0 && birdNeckDirection == -1) birdNeckDirection *= -1;
        if (birdNeckAngle > Math.PI / 4 && birdNeckDirection == 1) birdNeckDirection *= -1;
        document.getElementById("birdNeckRotationSlider").value = birdNeckAngle * 180 / (Math.PI);

        birdHeadAngle += update * birdHeadDirection;
        if (birdHeadAngle < 0 && birdHeadDirection == -1) birdHeadDirection *= -1;
        if (birdHeadAngle > Math.PI / 4 && birdHeadDirection == 1) birdHeadDirection *= -1;
        document.getElementById("birdHeadRotationSlider").value = birdHeadAngle * 180 / (Math.PI);

        birdRightWingAngle += update * birdRightWingDirection;
        if (birdRightWingAngle < 0 && birdRightWingDirection == -1) birdRightWingDirection *= -1;
        if (birdRightWingAngle > Math.PI / 4 && birdRightWingDirection == 1) birdRightWingDirection *= -1;
        document.getElementById("birdRightWingRotationSlider").value = birdRightWingAngle * 180 / (Math.PI);

        birdLeftWingAngle += update * birdLeftWingDirection;
        if (birdLeftWingAngle < 0 && birdLeftWingDirection == -1) birdLeftWingDirection *= -1;
        if (birdLeftWingAngle > Math.PI / 4 && birdLeftWingDirection == 1) birdLeftWingDirection *= -1;
        document.getElementById("birdLeftWingRotationSlider").value = birdLeftWingAngle * 180 / (Math.PI);

        birdUpperRightLegAngle += update * birdUpperRightLegDirection;
        if (birdUpperRightLegAngle < 0 && birdUpperRightLegDirection == -1) birdUpperRightLegDirection *= -1;
        if (birdUpperRightLegAngle > Math.PI / 4 && birdUpperRightLegDirection == 1) birdUpperRightLegDirection *= -1;
        document.getElementById("birdUpperRightLegRotationSlider").value = birdUpperRightLegAngle * 180 / (Math.PI);

        birdUpperLeftLegAngle += update * birdUpperLeftLegDirection;
        if (birdUpperLeftLegAngle < 0 && birdUpperLeftLegDirection == -1) birdUpperLeftLegDirection *= -1;
        if (birdUpperLeftLegAngle > Math.PI / 4 && birdUpperLeftLegDirection == 1) birdUpperLeftLegDirection *= -1;
        document.getElementById("birdUpperLeftLegRotationSlider").value = birdUpperLeftLegAngle * 180 / (Math.PI);

        birdLowerRightLegAngle += update * birdLowerRightLegDirection;
        if (birdLowerRightLegAngle < 0 && birdLowerRightLegDirection == -1) birdLowerRightLegDirection *= -1;
        if (birdLowerRightLegAngle > Math.PI / 4 && birdLowerRightLegDirection == 1) birdLowerRightLegDirection *= -1;
        document.getElementById("birdLowerRightLegRotationSlider").value = birdLowerRightLegAngle * 180 / (Math.PI);

        birdLowerLeftLegAngle += update * birdLowerLeftLegDirection;
        if (birdLowerLeftLegAngle < 0 && birdLowerLeftLegDirection == -1) birdLowerLeftLegDirection *= -1;
        if (birdLowerLeftLegAngle > Math.PI / 4 && birdLowerLeftLegDirection == 1) birdLowerLeftLegDirection *= -1;
        document.getElementById("birdLowerLeftLegRotationSlider").value = birdLowerLeftLegAngle * 180 / (Math.PI);

        birdRightFootAngle += update * birdRightFootDirection;
        if (birdRightFootAngle < 0 && birdRightFootDirection == -1) birdRightFootDirection *= -1;
        if (birdRightFootAngle > Math.PI / 4 && birdRightFootDirection == 1) birdRightFootDirection *= -1;
        document.getElementById("birdRightFootRotationSlider").value = birdRightFootAngle * 180 / (Math.PI);

        birdLeftFootAngle += update * birdLeftFootDirection;
        if (birdLeftFootAngle < 0 && birdLeftFootDirection == -1) birdLeftFootDirection *= -1;
        if (birdLeftFootAngle > Math.PI / 4 && birdLeftFootDirection == 1) birdLeftFootDirection *= -1;
        document.getElementById("birdLeftFootRotationSlider").value = birdLeftFootAngle * 180 / (Math.PI);
    
        // Claw Animation
        clawBaseRotation += (clawBaseRotation + update) % (2 * Math.PI)
        document.getElementById("clawBaseRotationSlider").value = clawBaseRotation * 180 / (Math.PI)

        clawArmTranslation += update*clawArmDirection;
        if(clawArmTranslation > 0 && clawArmDirection == 1) clawArmDirection *= -1;
        if(clawArmTranslation < -2 && clawArmDirection == -1) clawArmDirection *= -1;
        document.getElementById("clawArmTranslationSlider").value = clawArmTranslation * 100

        clawFirstUpperFingerRotation += 0.5*update*clawFirstDirection
        if(clawFirstUpperFingerRotation > 40 * Math.PI / 180 && clawFirstDirection == 1) clawFirstDirection *= -1;
        if(clawFirstUpperFingerRotation < 10 * Math.PI / 180 && clawFirstDirection == -1) clawFirstDirection *= -1;
        document.getElementById("clawFirstUpperFingerRotationSlider").value = clawFirstUpperFingerRotation * 180 / (Math.PI)

        clawSecondUpperFingerRotation += 0.5*update*clawSecondDirection
        if(clawSecondUpperFingerRotation > 40 * Math.PI / 180 && clawSecondDirection == 1) clawSecondDirection *= -1;
        if(clawSecondUpperFingerRotation < 10 * Math.PI / 180 && clawSecondDirection == -1) clawSecondDirection *= -1;
        document.getElementById("clawSecondUpperFingerRotationSlider").value = clawSecondUpperFingerRotation * 180 / (Math.PI)
    
        // Piston
        pistonPillarTranslation += update * pistonPillarDirection;
        if(pistonPillarTranslation > 0 && pistonPillarDirection == 1) pistonPillarDirection *= -1;
        if(pistonPillarTranslation < -1.2 && pistonPillarDirection == -1) pistonPillarDirection *= -1;
        document.getElementById("pistonPillarTranslationRotationSlider").value = pistonPillarTranslation * 100

    }
    initObjectTree();
}

function tick() {
    requestAnimationFrame(tick);
    for (var i = 0; i < 6; i++) {
        drawShadowMap(i);
    }
    drawScene();
    animate();
}

function initInputs() {
    document.getElementById("animation").checked = true;
    document.getElementById("lighting").checked = true;
    document.getElementById("texture").checked = true;
    document.getElementById("animation").onchange = function () {
        animating ^= 1;
        if (animating) {
            // Spider
            document.getElementById("baseSpiderRotationSlider").disabled = true;
            document.getElementById("firstRightSpiderRotationSlider").disabled = true;
            document.getElementById("secondRightSpiderRotationSlider").disabled = true;
            document.getElementById("thirdRightSpiderRotationSlider").disabled = true;
            document.getElementById("fourthRightSpiderRotationSlider").disabled = true;
            document.getElementById("firstLeftSpiderRotationSlider").disabled = true;
            document.getElementById("secondLeftSpiderRotationSlider").disabled = true;
            document.getElementById("thirdLeftSpiderRotationSlider").disabled = true;
            document.getElementById("fourthLeftSpiderRotationSlider").disabled = true;

            // Bird
            document.getElementById("birdBodyRotationSlider").disabled = true;
            document.getElementById("birdNeckRotationSlider").disabled = true;
            document.getElementById("birdHeadRotationSlider").disabled = true;
            document.getElementById("birdRightWingRotationSlider").disabled = true;
            document.getElementById("birdLeftWingRotationSlider").disabled = true;
            document.getElementById("birdUpperRightLegRotationSlider").disabled = true;
            document.getElementById("birdUpperLeftLegRotationSlider").disabled = true;
            document.getElementById("birdLowerRightLegRotationSlider").disabled = true;
            document.getElementById("birdLowerLeftLegRotationSlider").disabled = true;
            document.getElementById("birdRightFootRotationSlider").disabled = true;
            document.getElementById("birdLeftFootRotationSlider").disabled = true;

            // Claw Machine
            document.getElementById("clawBaseRotationSlider").disabled = true;
            document.getElementById("clawArmTranslationSlider").disabled = true;
            document.getElementById("clawFirstUpperFingerRotationSlider").disabled = true;
            document.getElementById("clawSecondUpperFingerRotationSlider").disabled = true;

            // Table
            document.getElementById("tableBodyRotationSlider").disabled = true;

            // Piston
            document.getElementById("pistonBodyRotationSlider").disabled = true;
            document.getElementById("pistonPillarTranslationRotationSlider").disabled = true;

        } else {
            // Spider
            document.getElementById("baseSpiderRotationSlider").disabled = false;
            document.getElementById("firstRightSpiderRotationSlider").disabled = false;
            document.getElementById("secondRightSpiderRotationSlider").disabled = false;
            document.getElementById("thirdRightSpiderRotationSlider").disabled = false;
            document.getElementById("fourthRightSpiderRotationSlider").disabled = false;
            document.getElementById("firstLeftSpiderRotationSlider").disabled = false;
            document.getElementById("secondLeftSpiderRotationSlider").disabled = false;
            document.getElementById("thirdLeftSpiderRotationSlider").disabled = false;
            document.getElementById("fourthLeftSpiderRotationSlider").disabled = false;

            // Bird
            document.getElementById("birdBodyRotationSlider").disabled = false;
            document.getElementById("birdNeckRotationSlider").disabled = false;
            document.getElementById("birdHeadRotationSlider").disabled = false;
            document.getElementById("birdRightWingRotationSlider").disabled = false;
            document.getElementById("birdLeftWingRotationSlider").disabled = false;
            document.getElementById("birdUpperRightLegRotationSlider").disabled = false;
            document.getElementById("birdUpperLeftLegRotationSlider").disabled = false;
            document.getElementById("birdLowerRightLegRotationSlider").disabled = false;
            document.getElementById("birdLowerLeftLegRotationSlider").disabled = false;
            document.getElementById("birdRightFootRotationSlider").disabled = false;
            document.getElementById("birdLeftFootRotationSlider").disabled = false;
        
            // Claw Machine
            document.getElementById("clawBaseRotationSlider").disabled = false;
            document.getElementById("clawArmTranslationSlider").disabled = false;
            document.getElementById("clawFirstUpperFingerRotationSlider").disabled = false;
            document.getElementById("clawSecondUpperFingerRotationSlider").disabled = false;

            // Table
            document.getElementById("tableBodyRotationSlider").disabled = false;

            // Piston
            document.getElementById("pistonBodyRotationSlider").disabled = false;
            document.getElementById("pistonPillarTranslationRotationSlider").disabled = false;
        }
    };

    // Spider
    document.getElementById("baseSpiderRotationSlider").oninput = function () {
        baseSpiderAngle = document.getElementById("baseSpiderRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("firstRightSpiderRotationSlider").oninput = function () {
        firstSpiderRightLegAngle = document.getElementById("firstRightSpiderRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("secondRightSpiderRotationSlider").oninput = function () {
        secondSpiderRightLegAngle = document.getElementById("secondRightSpiderRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("thirdRightSpiderRotationSlider").oninput = function () {
        thirdSpiderRightLegAngle = document.getElementById("thirdRightSpiderRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("fourthRightSpiderRotationSlider").oninput = function () {
        fourthSpiderRightLegAngle = document.getElementById("fourthRightSpiderRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("firstLeftSpiderRotationSlider").oninput = function () {
        firstSpiderLeftLegAngle = document.getElementById("firstLeftSpiderRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("secondLeftSpiderRotationSlider").oninput = function () {
        secondSpiderLeftLegAngle = document.getElementById("secondLeftSpiderRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("thirdLeftSpiderRotationSlider").oninput = function () {
        thirdSpiderLeftLegAngle = document.getElementById("thirdLeftSpiderRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("fourthLeftSpiderRotationSlider").oninput = function () {
        fourthSpiderLeftLegAngle = document.getElementById("fourthLeftSpiderRotationSlider").value * Math.PI / 180;
    }

    // Bird
    document.getElementById("birdBodyRotationSlider").oninput = function () {
        birdBodyAngle = document.getElementById("birdBodyRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdNeckRotationSlider").oninput = function () {
        birdNeckAngle = document.getElementById("birdNeckRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdHeadRotationSlider").oninput = function () {
        birdHeadAngle = document.getElementById("birdHeadRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdRightWingRotationSlider").oninput = function () {
        birdRightWingAngle = document.getElementById("birdRightWingRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdLeftWingRotationSlider").oninput = function () {
        birdLeftWingAngle = document.getElementById("birdLeftWingRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdUpperRightLegRotationSlider").oninput = function () {
        birdUpperRightLegAngle = document.getElementById("birdUpperRightLegRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdUpperLeftLegRotationSlider").oninput = function () {
        birdUpperLeftLegAngle = document.getElementById("birdUpperLeftLegRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdLowerRightLegRotationSlider").oninput = function () {
        birdLowerRightLegAngle = document.getElementById("birdLowerRightLegRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdLowerLeftLegRotationSlider").oninput = function () {
        birdLowerLeftLegAngle = document.getElementById("birdLowerLeftLegRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdRightFootRotationSlider").oninput = function () {
        birdRightFootAngle = document.getElementById("birdRightFootRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("birdLeftFootRotationSlider").oninput = function () {
        birdLeftFootAngle = document.getElementById("birdLeftFootRotationSlider").value * Math.PI / 180;
    }

    // Claw Machine 
    document.getElementById("clawBaseRotationSlider").oninput = function() {
        clawBaseRotation = document.getElementById("clawBaseRotation").value * Math.PI / 180;
    }
    document.getElementById("clawArmTranslationSlider").oninput = function() {
        clawArmTranslation = document.getElementById("clawArmTranslationSlider").value / 100;
    }
    document.getElementById("clawFirstUpperFingerRotationSlider").oninput = function() {
        clawFirstUpperFingerRotation = document.getElementById("clawFirstUpperFingerRotationSlider").value * Math.PI / 180
    }
    document.getElementById("clawSecondUpperFingerRotationSlider").oninput = function() {
        clawSecondUpperFingerRotation = document.getElementById("clawSecondUpperFingerRotationSlider").value * Math.PI / 180
    }

    // Table
    document.getElementById("tableBodyRotationSlider").oninput = function () {
        tableBodyAngle = document.getElementById("tableBodyRotationSlider").value * Math.PI / 180;
    }

    // Piston
    document.getElementById("pistonBodyRotationSlider").oninput = function () {
        pistonBodyAngle = document.getElementById("pistonBodyRotationSlider").value * Math.PI / 180;
    }
    document.getElementById("pistonPillarTranslationRotationSlider").oninput = function () {
        pistonPillarTranslation = document.getElementById("pistonPillarTranslationRotationSlider").value / 180;
    }

    document.getElementById("draw-mode").onchange = function () {
        var drawMode = document.getElementById("draw-mode").value;
        if (drawMode === "shading") objectDrawMode = gl.TRIANGLES;
        else objectDrawMode = gl.LINES;
    }
    document.getElementById("room-material").onchange = function () {
        roomMaterial = document.getElementById("room-material").value;
    }
    document.getElementById("spider-material").onchange = function () {
        spiderMaterial = document.getElementById("spider-material").value;
    }
    document.getElementById("bird-material").onchange = function () {
        birdMaterial = document.getElementById("bird-material").value;
    }
}

function configureTexture(image, textureno) {
    var texture = gl.createTexture();
    gl.activeTexture(textureno);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
        gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

}

function initTexture() {
    var image0 = new Image();
    image0.onload = function () {
        configureTexture(image0, gl.TEXTURE0);
    }
    image0.src = "img/arm_texture2.jpg"

    var image1 = new Image();
    image1.onload = function () {
        configureTexture(image1, gl.TEXTURE1);
    }
    image1.src = "img/wall2.jpg"

    var image2 = new Image();
    image2.onload = function () {
        configureTexture(image2, gl.TEXTURE2);
    }
    image2.src = "img/blue.jpg"

    var image3 = new Image();
    image3.onload = function () {
        configureTexture(image3, gl.TEXTURE3);
    }
    image3.src = "img/deep_blue.jpg"

    var image6 = new Image();
    image6.onload = function () {
        configureTexture(image6, gl.TEXTURE6);
    }
    image6.src = "img/black.jpg"

    var image7 = new Image();
    image7.onload = function () {
        configureTexture(image7, gl.TEXTURE7);
    }
    image7.src = "img/red.jpg"

    var image8 = new Image();
    image8.onload = function () {
        configureTexture(image8, gl.TEXTURE8);
    }
    image8.src = "img/glass.jpg"
}

function webGLStart() {
    var canvas = document.getElementById("canvas");
    canvas.height = window.innerHeight * 0.9;
    canvas.width = window.innerWidth;
    roomMaterial = document.getElementById("room-material").value;
    spiderMaterial = document.getElementById("spider-material").value;
    birdMaterial = document.getElementById("bird-material").value;
    initGL(canvas);
    initShaders();
    initBuffers();
    initObjectTree();
    initInputs();
    initTexture();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    initializeAtrributes()
    tick();
}

function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}
