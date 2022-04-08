



function midPointNaik(x1, y1, x2, y2){
    let dx = x2-x1;
    let dy = y2-y1;

    let d = dy - (dx / 2);
    let x = x1; 
    let y = y1;

    setPixel(x, y);

    while (x < x2){
        x++;
        if (d < 0) {
            d = d + dy
        }
        else {
            d += (dy - dx);
            y++;
        }
        setPixel(x, y)
    }
}

function midPointTurun(x1, y1, x2, y2)

