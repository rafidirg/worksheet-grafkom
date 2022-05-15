"use strict";

const cameraPosition = [10, 10, 10];
const upVector = [0, 1, 0];
const fPosition = [0, 0, 0];

var offset = 0;



window.onload = function main() {
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

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    
    // Enable Attrib Position
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Enable Attrib Normal
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);

    // Projection Matrix
    const projectionMatrix = m4.perspective(
        degToRad(60),
        canvas.width / canvas.height,
        1,
        200
    )

    const count = setBodySpider(gl)/3

    render()

    function render() {
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

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.drawArrays(gl.TRIANGLES, offset, count)


    }

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }
    
    function degToRad(d) {
        return d * Math.PI / 180;
    }

}
