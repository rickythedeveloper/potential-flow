import p5 from 'p5'

const sketch = (p: p5) => {
	p.setup = () => {
		console.log('Setting up...');
		p.createCanvas(500, 500)
		p.background(255, 0, 0)
	}
}

const sketchDiv = document.getElementById('sketch')
if (sketchDiv) {
	const myp5 = new p5(sketch, sketchDiv)
}