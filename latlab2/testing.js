function Draw2Dto3D(vert){
    var triangleVert = []

    let quads = [
        [1, 0, 3, 2],
        [2, 3, 7, 6],
        [3, 0, 4, 7],
        [6, 5, 1, 2],
        [4, 5, 6, 7],
        [5, 4, 0, 1]
    ]

    for (let q of quads) {
        let a = q[0]
        let b = q[1]
        let c = q[2]
        let d = q[3]

        let indices = [a, b, c, a, c, d]

        for (var indice of indices) {
            let tesselatedVertices = vert[indice]
            for (let vertex of tesselatedVertices) {
                triangleVert.push(vertex);
            }
        }
    }
	return triangleVert
}

let points_vert = [
    [0, 0, 30],
    [30, 0, 30],
    [0, 150, 30],
    [30, 150, 30],
    [0, 0, 0],
    [30, 0, 0],
    [0, 150, 0],
    [30, 150, 0],
]

console.log(Draw2Dto3D(points_vert))