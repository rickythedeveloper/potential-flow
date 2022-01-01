import p5 from 'p5'

class Vector2 {
	constructor(public x: number, public y: number) {}

	get magnitude(): number { return Math.sqrt(this.x ** 2  + this.y ** 2) }
	get normalized(): Vector2 { return Vector2.multiply(1/this.magnitude, this) }
	get asArray(): [number, number] { return [this.x, this.y] }
	
	copy = (): Vector2 => new Vector2(this.x, this.y)
	add = (v: Vector2) => { this.x += v.x; this.y += v.y }
	subtract = (v: Vector2) => { this.x - v.x; this.y - v.y }
	multiply = (scalar: number) => { this.x *= scalar; this.y *= scalar }

	static add = (v1: Vector2, v2: Vector2): Vector2 => new Vector2(v1.x + v2.x, v1.y + v2.y)
	static subtract = (v1: Vector2, v2: Vector2) => new Vector2(v1.x - v2.x, v1.y - v2.y)
	static multiply = (scalar: number, v: Vector2) => new Vector2(scalar * v.x, scalar * v.y)
}

enum FlowPrimitiveType {
	source,
	sink,
	uniform
}
interface FlowPrimitive {
	primitiveType: FlowPrimitiveType,
	strength: number,
	position: Vector2,
	direction: number // in rad
}

type VelocityFunction = (primitive: FlowPrimitive, position: Vector2) => Vector2
const velocityFunction: VelocityFunction = (primitive, position) => {
	switch (primitive.primitiveType) {
		case FlowPrimitiveType.source:
			return sourceVelocityFunction(primitive, position)
		case FlowPrimitiveType.sink:
			return sinkVelocityFunction(primitive, position)
		case FlowPrimitiveType.uniform:
			return uniformVelocityFunction(primitive, position)
		default:
			return new Vector2(0, 0)
	}
}
const sourceVelocityFunction: VelocityFunction = (primitive, position) => {
	const relativePos = Vector2.subtract(position, primitive.position)
	const direction = relativePos.normalized
	const speed = primitive.strength / (2 * Math.PI * relativePos.magnitude)
	return Vector2.multiply(speed, direction)
}
const sinkVelocityFunction: VelocityFunction = (primitive, position) => { return Vector2.multiply(-1, sourceVelocityFunction(primitive, position)) }
const uniformVelocityFunction: VelocityFunction = (primitive, position) => Vector2.multiply(
	primitive.strength,
	new Vector2(Math.cos(primitive.direction), Math.sin(primitive.direction))
)

const primitives: FlowPrimitive[] = [
	{primitiveType: FlowPrimitiveType.source, strength: 2, position: new Vector2(0, 0), direction: 0},
	{primitiveType: FlowPrimitiveType.sink, strength: 2, position: new Vector2(1, 0), direction: 0},
	{primitiveType: FlowPrimitiveType.uniform, strength: 1, position: new Vector2(0, 0), direction: 0}
]

const starts: Vector2[] = []
for (let x = -1; x <= -0.9; x += 0.5) {
	for (let y = -2; y < 2; y += 0.05) {
		starts.push(new Vector2(x, y))
	}
}

const sketch = (p: p5) => {
	const scale = 1/100
	const particlePositions: Vector2[] = []
	p.setup = () => {
		p.createCanvas(500, 500)
	}
	
	p.draw = () => {
		p.background(255)
		p.stroke(0)
		p.rect(0, 0, p.width, p.height)
		p.stroke(255, 0, 0)
		starts.forEach(s => p.circle(...positionWorldToCanvas(s).asArray, 5))
		if (p.frameCount % 5 === 0) spawnNewParticles()
		rollForward(0.05)
		cleanParticles(-5, 5, -5, 5)
		p.stroke(0)
		particlePositions.forEach(pos => {
			p.circle(...positionWorldToCanvas(pos).asArray, 2)
		})
	}

	const spawnNewParticles = () => {
		starts.forEach(s => {
			particlePositions.push(s)
		})
	}

	const rollForward = (dt: number) => {
		for (let i = 0; i < particlePositions.length; i++) {
			const position = particlePositions[i]
			const velocity = getVelocityAtPosition(position)
			const newPosition = Vector2.add(position, Vector2.multiply(dt, velocity))
			particlePositions[i] = newPosition
		}
	}

	const cleanParticles = (xmin: number, xmax: number, ymin: number, ymax: number) => {
		const lastIndex = particlePositions.length - 1
		for (let i = lastIndex; i >= 0; i--) {
			const position = particlePositions[i]
			if (position.x < xmin || position.x > xmax || position.y < ymin || position.y > ymax) {
				particlePositions.splice(i, 1)
			}
		}
	}

	const getVelocityAtPosition = (position: Vector2): Vector2 => {
		const velocity = new Vector2(0, 0)
		for (let p = 0; p < primitives.length; p++) {
			velocity.add(velocityFunction(primitives[p], position))
		}
		return velocity
	}
	
	const drawStreamline = (position: Vector2, dt=0.01, tMax=100, maxDD=0.01) => {
		let currentPosition = position.copy()
		for (let k = 0; k < tMax/dt; k++) {
			const velocity = new Vector2(0, 0)
			for (let p = 0; p < primitives.length; p++) {
				velocity.add(velocityFunction(primitives[p], currentPosition))
			}
			let deltaPosition = Vector2.multiply(dt, velocity)
			if (deltaPosition.magnitude > maxDD) deltaPosition.multiply(0.01 / deltaPosition.magnitude)
			
			const newPosition = Vector2.add(currentPosition, deltaPosition)
			p.line(...positionWorldToCanvas(currentPosition).asArray, ...positionWorldToCanvas(newPosition).asArray)
			currentPosition = newPosition
		}
	}

	// const positionCanvasToWorld = (pos: Vector2) => {
	// 	return new Vector2(
	// 		(pos.x - p.width/2) * scale,
	// 		(pos.y - p.height/2) * scale
	// 	)
	// }
	
	const positionWorldToCanvas = (pos: Vector2) => {
		return new Vector2(
			pos.x / scale + p.width/2,
			pos.y / scale + p.height/2
		)
	}	
}

const sketchDiv = document.getElementById('sketch')
if (sketchDiv) {
	const myp5 = new p5(sketch, sketchDiv)
}