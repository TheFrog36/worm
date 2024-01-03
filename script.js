/* Possible types of worm motions
p = array of body points where p[0] is the head
p[0] follows mouse
p[0] is the first point that is drawn
1) p[1] move toward the new position of p[0]
2) p[1] moves along the previous path, keeping the same distance from p[0]
3) 1) but with max angles ? 
after each step each, the distance between each point must be the same as the previous step
*/
/*
delta based timing
each point will also need a direction array
*/
const canvas = document.getElementById("main-canvas")
const ctx = canvas.getContext("2d")


const wormColor="white"
const dotRadius = 2
const segments = 100
const segmentLength = 10
const speed = 8.7
const maxAngle =  45// -15, 15
const initialAngleDiff = 10
const tempMultiplier = 2

const body = [] // {point:{x, y}, angle}[]

const mainContainer = document.getElementById("main-container")
let mousePosition = {x: canvas.width / 2, y: canvas.height / 2}

canvas.addEventListener('mousemove', function(event) {
    mousePosition = getRelativeCanvasPosition(canvas, event);
});
resizeCanvas()

new ResizeObserver(resizeCanvas).observe(mainContainer)

generateWorm()
gameLoop()

function gameLoop(){
    setInterval(() => {
        update()
        render()
    
    }, 30);
}

function update(){
    body[0].point =  moveTowards(body[0].point, mousePosition, speed)
    for(let i = 1; i < body.length; i++){
        const oldPosition = body[i].point
        body[i].point = moveTowards(body[i].point, body[i-1].point, speed, segmentLength)
        body[i].travelled = getDistanceBetweenPoints(oldPosition, body[i].point)
    }
}


function render(){
    clearCanvas()
    drawPoints()
    drawSegments()
}

//////////////////////////////////////////////////////////////

function getDistanceBetweenPoints(p1, p2){
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)
}

function resizeCanvas(){
    canvas.width = mainContainer.clientWidth
    canvas.height = mainContainer.clientHeight
}

function generateWorm(){
    let startingAngle = maxAngle
    let sign = 1
    body.push({point: {x: canvas.width/2, y: canvas.height/2}})
    for(let i = 0; i < segments; i++){
        body.push({point:{x: body[i].point.x - segments, y: body[0].point.y}})
        // if(i == segments) continue
    }
    for(let i = segments - 1; i > 0; i--){
        body[i].angle = startingAngle
        body[i].sign = sign
        const dum = bounceNumber(-maxAngle, maxAngle, startingAngle + initialAngleDiff*sign, sign)
        startingAngle = dum.value
        sign = dum.sign

    }
}

function bounceNumber(lowerLimit, upperLimit, value, sign=null) {
    while(value > upperLimit || value < lowerLimit){
        if(value > upperLimit) {
            value = upperLimit * 2 - value
            sign = -1
        }
        if(value < lowerLimit) {
            value = lowerLimit * 2 - value
            sign = 1
        }
    }
    return {value, sign}
}   

function moveTowards(point1, point2, speed, fixedLength) {
    const direction = {
        x: point2.x - point1.x,
        y: point2.y - point1.y
    };
    const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2)
    if(distance < speed && !fixedLength) return mousePosition
    const normalizedDirection = {
        x: direction.x / distance,
        y: direction.y / distance
    }
    let newX
    let newY
    if(fixedLength) {
        newX = point2.x - normalizedDirection.x * fixedLength 
        newY = point2.y - normalizedDirection.y * fixedLength
    } else {
        newX = point1.x + normalizedDirection.x * speed
        newY = point1.y + normalizedDirection.y * speed
    }
    return  { x: newX, y: newY } 
}

function getRelativeCanvasPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    return { x, y };
}

function calculateAngle(point1, point2) {
    const deltaX = point2.x - point1.x;
    const deltaY = point2.y - point1.y;
    const angleRadians = Math.atan2(deltaY, deltaX);
    const positiveAngle = angleRadians < 0 ? angleRadians + 2 * Math.PI : angleRadians;
    return positiveAngle;
}

function drawPoints(){
    for(let i = 0; i < body.length; i++){
        drawDot(body[i].point, dotRadius, wormColor)
        if(i == 0 || i == body.length-1) continue
        const angleSpeedMultiplier = 0.9
        const baseAngle = calculateAngle(body[i-1].point, body[i+1].point) + Math.PI / 2 + degreesToRadians(body[i].angle)
        const angleToAdd = body[i].sign * initialAngleDiff * angleSpeedMultiplier
        const dum = bounceNumber(-maxAngle, maxAngle, body[i].angle + angleToAdd, body[i].sign)
        body[i].angle = dum.value
        body[i].sign = dum.sign
        const segmentX1 = body[i].point.x + Math.cos(baseAngle) * segmentLength * tempMultiplier
        const segmentY1 = body[i].point.y + Math.sin(baseAngle) * segmentLength * tempMultiplier
        const segmentX2 = body[i].point.x - Math.cos(baseAngle) * segmentLength * tempMultiplier
        const segmentY2 = body[i].point.y - Math.sin(baseAngle) * segmentLength * tempMultiplier
        const segmentX3 = segmentX1 + Math.cos(baseAngle + degreesToRadians(body[i].angle)) * segmentLength * tempMultiplier
        const segmentY3 = segmentY1 + Math.sin(baseAngle + degreesToRadians(body[i].angle)) * segmentLength * tempMultiplier
        const segmentX4 = segmentX2 - Math.cos(baseAngle + degreesToRadians(body[i].angle)) * segmentLength * tempMultiplier
        const segmentY4 = segmentY2 - Math.sin(baseAngle + degreesToRadians(body[i].angle)) * segmentLength * tempMultiplier
        
        drawSegment({x: segmentX1, y: segmentY1}, {x: segmentX2, y: segmentY2}, wormColor)
        drawSegment({x: segmentX1, y: segmentY1}, {x: segmentX3, y: segmentY3}, wormColor)
        drawSegment({x: segmentX4, y: segmentY4}, {x: segmentX2, y: segmentY2}, wormColor)

        drawDot({x: segmentX1, y: segmentY1}, dotRadius, wormColor)
        drawDot({x: segmentX2, y: segmentY2}, dotRadius, wormColor)
        drawDot({x: segmentX3, y: segmentY3}, dotRadius, "red")
        drawDot({x: segmentX4, y: segmentY4}, dotRadius, "cyan")

    }
}

function drawSegments(){
    for(let i = 0; i < body.length-1; i++){
        drawSegment(body[i].point, body[i+1].point, wormColor)
    }
}

function drawDot(p, radius, color){
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.closePath()
}

function drawSegment(p1, p2, color){
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineWidth = 1
    ctx.strokeStyle = color
    ctx.stroke();
    ctx.closePath()
}

function clearCanvas(){
    // ctx.rect(0, 0, canvas.width, canvas.height)
    // ctx.fillStyle = "rgba(0, 0, 0, 0.01)"
    // ctx.fill()
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}  

function angleBetweenPoints(point1, point2, point3) {
    // Calculate vectors
    const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
    const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };

    // Calculate dot product
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;

    // Calculate magnitudes
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    // Calculate cosine of the angle
    const cosineTheta = dotProduct / (magnitude1 * magnitude2);

    // Calculate the angle in radians
    const angleRadians = Math.acos(cosineTheta);

    return angleRadians;
}
