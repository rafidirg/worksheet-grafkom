// Reference drawing point reference
// https://www.tutorialspoint.com/webgl/webgl_drawing_points.htm

let program
let canvas
let gl
let vertices = []

window.onload = function init() {

    /* Creating canvas */
    canvas = document.getElementById("gl-canvas")
    gl = canvas.getContext('webgl2', {antialias: false})
    if (!gl) alert("WebGL not Supported")

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    render()

}

function getMousePos(event) {
    return [
        (2 * (event.clientX - offsetX)) / canvas.width - 1,
        (2 * (canvas.height - (event.clientY - offsetY))) / canvas.height - 1
    ]
}

function render() {
    // Kuadran 1
    midPointLine(25, 25, 50, 50)

    // Kuadran 2
    midPointLine(-20, 25, 0, 0)

    // Kuadran 3
    midPointLine(-35, -50, -20, -20)

    // Kuadran 4
    midPointLine(25, -25, 50, -30)



    /* Define and store geometry */
    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    
    /* Associating shaders to buffer objects */
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var coord = gl.getAttribLocation(program, "coordinates");
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    /* Draw the points */
    gl.clearColor( 0.1, 0.2, 0.2, 0.2 );
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.drawArrays(gl.POINTS, 0, vertices.length / 3);
}

function midPointLine(x1, y1, x2, y2) {
    let dx, dy, d;
    let k = 0;
    dx = (x2 - x1);
    dy = (y2 - y1);
    
    let x_arr = [];
    let y_arr = [];

    if (dy <= dx && dy > 0) {
        dx = Math.abs(dx);
        dy = Math.abs(dy);
        d = (2 * dy) - dx;

        x_arr.push(x1)
        y_arr.push(y1)

        vertices.push(x1/100);
        vertices.push(y1/100)
        vertices.push(0.0)

        let xk = x1;
        let yk = y1;

        for (k = x1; k < x2; k++) {
            if (d < 0) {
                x_arr.push(++xk)
                y_arr.push(yk)
                
                vertices.push(xk/100);
                vertices.push(yk/100)
                vertices.push(0.0)


                d = d + (2 * dy);
            }
            else {
                x_arr.push(++xk)
                y_arr.push(++yk)

                vertices.push(xk/100);
                vertices.push(yk/100)
                vertices.push(0.0)

                d = d + 2 * (dy - dx);
            }
        }
    }
    else if (dy > dx && dy > 0) {
        dx = Math.abs(dx);
        dy = Math.abs(dy);
        d = (2 * dy) - dx;

        x_arr.push(x1)
        y_arr.push(y1)

        vertices.push(x1/100);
        vertices.push(y1/100)
        vertices.push(0.0)

        let xk = x1;
        let yk = y1;

        for (k = y1; k < y2; k++) {
            if (d < 0) {
                x_arr.push(xk)
                y_arr.push(++yk)

                vertices.push(xk/100);
                vertices.push(yk/100)
                vertices.push(0.0)

                d = d + (2 * dx);
            }
            else {
                x_arr.push(++xk)
                y_arr.push(++yk)

                vertices.push(xk/100);
                vertices.push(yk/100)
                vertices.push(0.0)

                d = d + 2 * (dx - dy);
            }
        }
    }
    else if (dy >= -dx) {
        dx = Math.abs(dx);
        dy = Math.abs(dy);
        d = (2 * dy) - dx;

        x_arr.push(x1)
        y_arr.push(y1)

        vertices.push(x1/100);
        vertices.push(y1/100)
        vertices.push(0.0)

        let xk = x1;
        let yk = y1;

        for (k = x1; k < x2; k++) {
            if (d < 0) {
                x_arr.push(++xk)
                y_arr.push(yk)

                vertices.push(xk/100);
                vertices.push(yk/100)
                vertices.push(0.0)

                d = d + (2 * dy);
            }
            else {
                x_arr.push(++xk)
                y_arr.push(--yk)

                vertices.push(xk/100);
                vertices.push(yk/100)
                vertices.push(0.0)

                d = d + 2 * (dy - dx);
            }
        }
    }
    else if (dy < -dx) {
        dx = Math.abs(dx);
        dy = Math.abs(dy);
        d = (2 * dy) - dx;

        x_arr.push(x1)
        y_arr.push(y1)

        vertices.push(x1/100);
        vertices.push(y1/100)
        vertices.push(0.0)

        let xk = x1;
        let yk = y1;
        
        for (k = y1; k > y2; k--) {
            if (d < 0) {
                x_arr.push(xk)
                y_arr.push(--yk)

                vertices.push(xk/100);
                vertices.push(yk/100)
                vertices.push(0.0)

                d = d + (2 * dx);
            }
            else {
                x_arr.push(++xk)
                y_arr.push(--yk)

                vertices.push(xk/100);
                vertices.push(yk/100)
                vertices.push(0.0)

                d = d + 2 * (dx - dy);
            }
        }
    }
}