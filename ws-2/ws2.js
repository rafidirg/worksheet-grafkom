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
  gl_Position = u_world * a_position;

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
        parent.children.push(this);
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

    twgl.setAttributePrefix("a_")
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const uniforms = {
        u_lightWorldPosition: [0, 25, 0],
        u_color: [0.5, 1, 0.5, 1]
    }

    // Create Buffer and VAO Spider
    var spiderBodyBufferInfo = twgl.createBufferInfoFromArrays(gl, spiderBodyArrays);
    var r1BufferInfo = twgl.createBufferInfoFromArrays(gl, r1Arrays);
    var r2BufferInfo = twgl.createBufferInfoFromArrays(gl, r2Arrays);
    var r3BufferInfo = twgl.createBufferInfoFromArrays(gl, r3Arrays);
    var r4BufferInfo = twgl.createBufferInfoFromArrays(gl, r4Arrays);
    var l1BufferInfo = twgl.createBufferInfoFromArrays(gl, l1Arrays);
    var l2BufferInfo = twgl.createBufferInfoFromArrays(gl, l2Arrays);
    var l3BufferInfo = twgl.createBufferInfoFromArrays(gl, l3Arrays);
    var l4BufferInfo = twgl.createBufferInfoFromArrays(gl, l4Arrays);

    var spiderBodyVAO = twgl.createVAOFromBufferInfo(gl, programInfo, spiderBodyBufferInfo);
    var r1VAO = twgl.createVAOFromBufferInfo(gl, programInfo, r1BufferInfo);
    var r2VAO = twgl.createVAOFromBufferInfo(gl, programInfo, r2BufferInfo);
    var r3VAO = twgl.createVAOFromBufferInfo(gl, programInfo, r3BufferInfo);
    var r4VAO = twgl.createVAOFromBufferInfo(gl, programInfo, r4BufferInfo);
    var l1VAO = twgl.createVAOFromBufferInfo(gl, programInfo, l1BufferInfo);
    var l2VAO = twgl.createVAOFromBufferInfo(gl, programInfo, l2BufferInfo);
    var l3VAO = twgl.createVAOFromBufferInfo(gl, programInfo, l3BufferInfo);
    var l4VAO = twgl.createVAOFromBufferInfo(gl, programInfo, l4BufferInfo);

    // Create Node
    var spiderBodyNode = new Node();
    spiderBodyNode.localMatrix = m4.translation(-5, 0, 0);
    spiderBodyNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: spiderBodyBufferInfo,
        vertexArray: spiderBodyVAO,
    };

    var r1Node = new Node();
    r1Node.localMatrix = m4.translation(0, 0, 0);
    r1Node.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: r1BufferInfo,
        vertexArray: r1VAO,
    };

    var r2Node = new Node();
    r2Node.localMatrix = m4.translation(0, 0, 0);
    r2Node.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: r2BufferInfo,
        vertexArray: r2VAO,
    };

    var r3Node = new Node();
    r3Node.localMatrix = m4.translation(0, 0, 0);
    r3Node.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: r3BufferInfo,
        vertexArray: r3VAO,
    };

    var r4Node = new Node();
    r4Node.localMatrix = m4.translation(0, 0, 0);
    r4Node.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: r4BufferInfo,
        vertexArray: r4VAO,
    };

    var l1Node = new Node();
    l1Node.localMatrix = m4.translation(0, 0, 0);
    l1Node.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: l1BufferInfo,
        vertexArray: l1VAO,
    };

    var l2Node = new Node();
    l2Node.localMatrix = m4.translation(0, 0, 0);
    l2Node.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: l2BufferInfo,
        vertexArray: l2VAO,
    };

    var l3Node = new Node();
    l3Node.localMatrix = m4.translation(0, 0, 0);
    l3Node.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: l3BufferInfo,
        vertexArray: l3VAO,
    };

    var l4Node = new Node();
    l4Node.localMatrix = m4.translation(0, 0, 0);
    l4Node.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: l4BufferInfo,
        vertexArray: l4VAO,
    };

    r1Node.setParent(spiderBodyNode);
    r2Node.setParent(spiderBodyNode);
    r3Node.setParent(spiderBodyNode);
    r4Node.setParent(spiderBodyNode);
    l1Node.setParent(spiderBodyNode);
    l2Node.setParent(spiderBodyNode);
    l3Node.setParent(spiderBodyNode);
    l4Node.setParent(spiderBodyNode);

    // Create Buffer and VAO Bird
    var bodyBufferInfo = twgl.createBufferInfoFromArrays(gl, bodyArrays);
    var upLeftBufferInfo = twgl.createBufferInfoFromArrays(gl, upLeftLegArrays);
    var lowLeftBufferInfo = twgl.createBufferInfoFromArrays(gl, lowLeftLegArrays);
    var upRightBufferInfo = twgl.createBufferInfoFromArrays(gl, upRightLegArrays);
    var lowRightBufferInfo = twgl.createBufferInfoFromArrays(gl, lowRightLegArrays);
    var leftWingBufferInfo = twgl.createBufferInfoFromArrays(gl, leftWingArrays);
    var rightWingBufferInfo = twgl.createBufferInfoFromArrays(gl, rightWingArrays);
    var neckBufferInfo = twgl.createBufferInfoFromArrays(gl, neckArrays);
    var headBufferInfo = twgl.createBufferInfoFromArrays(gl, headArrays);

    var bodyVAO = twgl.createVAOFromBufferInfo(gl, programInfo, bodyBufferInfo);
    var upLeftVAO = twgl.createVAOFromBufferInfo(gl, programInfo, upLeftBufferInfo);
    var lowLeftVAO = twgl.createVAOFromBufferInfo(gl, programInfo, lowLeftBufferInfo);
    var upRightVAO = twgl.createVAOFromBufferInfo(gl, programInfo, upRightBufferInfo);
    var lowRightVAO = twgl.createVAOFromBufferInfo(gl, programInfo, lowRightBufferInfo);
    var leftWingVAO = twgl.createVAOFromBufferInfo(gl, programInfo, leftWingBufferInfo);
    var rightWingVAO = twgl.createVAOFromBufferInfo(gl, programInfo, rightWingBufferInfo);
    var neckVAO = twgl.createVAOFromBufferInfo(gl, programInfo, neckBufferInfo);
    var headVAO = twgl.createVAOFromBufferInfo(gl, programInfo, headBufferInfo);

    var bodyNode = new Node();
    bodyNode.localMatrix = m4.multiply(m4.translation(15, 0, 0), m4.yRotation(degToRad(90)));
    bodyNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: bodyBufferInfo,
        vertexArray: bodyVAO,
    };

    var upLeftNode = new Node();
    upLeftNode.localMatrix = m4.translation(0, 0, 0);
    upLeftNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: upLeftBufferInfo,
        vertexArray: upLeftVAO,
    };

    var lowLeftNode = new Node();
    lowLeftNode.localMatrix = m4.translation(0, 0, 0);
    lowLeftNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: lowLeftBufferInfo,
        vertexArray: lowLeftVAO,
    };

    var upRightNode = new Node();
    upRightNode.localMatrix = m4.translation(0, 0, 0);
    upRightNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: upRightBufferInfo,
        vertexArray: upRightVAO,
    };

    var lowRightNode = new Node();
    lowRightNode.localMatrix = m4.translation(0, 0, 0);
    lowRightNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: lowRightBufferInfo,
        vertexArray: lowRightVAO,
    };

    var leftWingNode = new Node();
    leftWingNode.localMatrix = m4.translation(0, 0, 0);
    leftWingNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: leftWingBufferInfo,
        vertexArray: leftWingVAO,
    };

    var rightWingNode = new Node();
    rightWingNode.localMatrix = m4.translation(0, 0, 0);
    rightWingNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: rightWingBufferInfo,
        vertexArray: rightWingVAO,
    };

    var neckNode = new Node();
    neckNode.localMatrix = m4.translation(0, 0, 0);
    neckNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: neckBufferInfo,
        vertexArray: neckVAO,
    };

    var headNode = new Node();
    headNode.localMatrix = m4.translation(0, 0, 0);
    headNode.drawInfo = {
        uniforms: {},
        programInfo: programInfo,
        bufferInfo: headBufferInfo,
        vertexArray: headVAO,
    };

    upLeftNode.setParent(bodyNode);
    upRightNode.setParent(bodyNode);
    lowLeftNode.setParent(upLeftNode);
    lowRightNode.setParent(upRightNode);
    rightWingNode.setParent(bodyNode);
    leftWingNode.setParent(bodyNode);
    neckNode.setParent(bodyNode);
    headNode.setParent(neckNode);

    var lightSphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 2, 12, 6);
    var lightSphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, lightSphereBufferInfo);

    var lightNode = new Node();
    lightNode.localMatrix = m4.translation(
        uniforms.u_lightWorldPosition[0],
        uniforms.u_lightWorldPosition[1],
        uniforms.u_lightWorldPosition[2],
        )
    lightNode.drawInfo = {
        uniforms: {
            u_color: [1, 1, 0.2, 1],
        },
        programInfo: programInfo,
        bufferInfo: lightSphereBufferInfo,
        vertexArray: lightSphereVAO,
    }

    var objects = [
        spiderBodyNode, 
        r1Node, 
        r2Node,
        r3Node,
        r4Node,
        l1Node, 
        l2Node,
        l3Node,
        l4Node,
        bodyNode,
        upLeftNode,
        lowLeftNode,
        upRightNode,
        lowRightNode,
        leftWingNode,
        rightWingNode,
        neckNode,
        headNode,
        lightNode,
    ];
    var objectsToDraw = [
        spiderBodyNode.drawInfo, 
        r1Node.drawInfo,
        r2Node.drawInfo,
        r3Node.drawInfo,
        r4Node.drawInfo,
        l1Node.drawInfo,
        l2Node.drawInfo,
        l3Node.drawInfo,
        l4Node.drawInfo,
        bodyNode.drawInfo,
        upLeftNode.drawInfo,
        lowLeftNode.drawInfo,
        upRightNode.drawInfo,
        lowRightNode.drawInfo,
        leftWingNode.drawInfo,
        rightWingNode.drawInfo,
        neckNode.drawInfo,
        headNode.drawInfo,
        lightNode.drawInfo,
    ];

    var cameraPosition = [0, 60, 40];
    var target = [0, 20, 0];
    var up = [0, 1, 0];

    // Animating 
    var animating = false;
    var angle = 0;
    document.getElementById("animate").onclick = function(_e) {
        animating = !animating;
    }

    // Camera Roll
    var cameraRoll = false;
    var camAngle = 0;
    document.getElementById("camera").onclick = function(_e){
        cameraRoll = !cameraRoll
    }


    requestAnimationFrame(render)

    function render() {

        gl.useProgram(programInfo.program);

        // tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        // Clear the canvas and the depth buffer
        gl.clearColor(0, 0, 0, 0.1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Projection Matrix
        const projectionMatrix = 
            m4.perspective(degToRad(60), canvas.width / canvas.height, 1, 200);

        if (animating) {
            angle += 1
            neckNode.localMatrix = m4.zRotation(0.03 * Math.sin(degToRad(angle)))
            leftWingNode.localMatrix = m4.xRotation(-0.03 * Math.sin(degToRad(angle)))
            rightWingNode.localMatrix = m4.xRotation(0.03 * Math.sin(degToRad(angle)))

            r1Node.localMatrix = m4.yRotation(0.05 * Math.sin(degToRad(angle)))
            r2Node.localMatrix = m4.yRotation(0.05 * Math.sin(degToRad(angle)))
            r3Node.localMatrix = m4.yRotation(0.05 * Math.sin(degToRad(angle)))
            r4Node.localMatrix = m4.yRotation(0.05 * Math.sin(degToRad(angle)))
            l1Node.localMatrix = m4.yRotation(0.05 * Math.sin(degToRad(angle)))
            l2Node.localMatrix = m4.yRotation(0.05 * Math.sin(degToRad(angle)))
            l3Node.localMatrix = m4.yRotation(0.05 * Math.sin(degToRad(angle)))
            l4Node.localMatrix = m4.yRotation(0.05 * Math.sin(degToRad(angle)))
        }
        
        if (cameraRoll) {
            camAngle += 0.1
            cameraPosition[0] = 40 * Math.sin(degToRad(camAngle))
            cameraPosition[2] = 40 * Math.cos(degToRad(camAngle))
        }

        // Compute camera matrix using look at.
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);
        const viewMatrix = m4.inverse(cameraMatrix);
        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        bodyNode.updateWorldMatrix();
        spiderBodyNode.updateWorldMatrix();
        lightNode.updateWorldMatrix();

        objects.forEach(function(object) {
            object.drawInfo.uniforms.u_world = 
                m4.multiply(viewProjectionMatrix, object.worldMatrix);
            object.drawInfo.uniforms.u_worldViewProjection = 
                m4.multiply(viewProjectionMatrix, object.drawInfo.uniforms.u_world);
            object.drawInfo.uniforms.u_worldInverseTranspose = 
                m4.transpose(m4.inverse(object.drawInfo.uniforms.u_world))
        });

        twgl.setUniforms(programInfo, uniforms);

        twgl.drawObjectList(gl, objectsToDraw);

        requestAnimationFrame(render)
    }

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }
    
    function degToRad(d) {
        return d * Math.PI / 180;
    }

}

main();