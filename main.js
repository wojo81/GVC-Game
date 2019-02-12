
class Entity {
	
	constructor() {
		this._image= new Image();
		
		this._image.style.position= "absolute";
		
		this._image.width= ENTITY_WIDTH;
		this._image.height= ENTITY_HEIGHT;
		
		this._image.style.top= "0px";
		this._image.style.left= "0px";

		this._image.style.display= "none";
		
		document.body.appendChild(this._image);
	}
	
	display(imagePaths) {
		let randomIndex= Math.floor(Math.random() * imagePaths.length);
		this._image.src= "resources/" + imagePaths[randomIndex];
		this._image.style.display= "block";
	}
	
	clearDisplay() {
		this._image.style.display= "none"
	}
	
	get left() {
		return parseInt(this._image.style.left);
	}
	
	get top() {
		return parseInt(this._image.style.top);
	}
	
	get right() {
		return this.left + this._image.width;
	}
	
	get bottom() {
		return this.top + this._image.height;
	}
	
	get width() {
		return this._image.width;
	}
	
	get height() {
		return this._image.height;
	}
	
	
	
	set left(newLeft) {
		this._image.style.left= newLeft + "px";
	}
	
	set top(newTop) {
		this._image.style.top= newTop + "px";
	}
	
	collidesWith(other) {
		return this.left < other.right &&
			   this.right > other.left &&
			   this.top < other.bottom &&
			   this.bottom > other.top;
	}
	
	removeFromBody() {
		document.body.removeChild(this._image);
	}
}

class Food extends Entity {
	
	constructor(server) {
		super();
		this._speed= Math.random() * (MAX_FOOD_SPEED - MIN_FOOD_SPEED + 1) + MIN_FOOD_SPEED
		this.left= server.left;
		this.top= server.top;
	}
	
	update() {
		this.top+= this._speed;
		
		if(this.top > window.innerHeight) {
			this.removeFromBody();
			removeFood(this);
		} else if(this.collidesWith(player)) {
			this.removeFromBody();
			removeFood(this);
			this.handleEaten();
		}
	}
	
	handleEaten() {}
}

class HealthyFood extends Food {
	
	constructor(server) {
		super(server);
	}
	
	display() {
		super.display(HEALTHY_FOOD_PATHS);
	}
	
	handleEaten() {
		addToScore(1);
	}
}

class UnhealthyFood extends Food {
	
	constructor(server) {
		super(server);
	}
	
	display() {
		super.display(UNHEALTHY_FOOD_PATHS);
	}
	
	handleEaten() {
		endGame();
	}
}

class Server extends Entity {
	constructor(healthy, timeBetweenDrops) {
		super();

		this._healthy= healthy
		this._timeBetweenDrops= timeBetweenDrops;
		
		this.genTimeBetweenShifts();
	}
	
	display() {
		this.left= window.innerWidth / 2 - this.width / 2;
		this.top= window.innerHeight / 45;
		
		this._moveLeft= true;
		
		this._lastTimeDropped= Date.now();
		this._lastTimeShifted= Date.now();
		
		if(this._healthy) {
			super.display(HEALTHY_SERVER_PATHS);
		} else {
			super.display(UNHEALTHY_SERVER_PATHS);
		}
	}
	
	update() {

		let currentTime= Date.now();

		if(currentTime >= this._lastTimeDropped + this._timeBetweenDrops) {
			this.makeFood();
			this._lastTimeDropped= currentTime;
		}
		
		if(currentTime >= this._lastTimeShifted + this._timeBetweenShifts) {
			this._moveLeft= !this._moveLeft;
			this._lastTimeShifted= currentTime;
			this.genTimeBetweenShifts();
		}
		
		if(this._moveLeft) {
			this.left-= SERVER_SPEED;
			if(this.left <= LEFT_BOUND) {
				this._moveLeft= false;
				this.left= LEFT_BOUND;
			}
		} else {
			this.left+= SERVER_SPEED;
			if(this.right >= window.innerWidth - LEFT_BOUND) {
				this._moveLeft= true;
				this.left= window.innerWidth - LEFT_BOUND - this.width;
			}
		}
	}
	
	genTimeBetweenShifts() {
		this._timeBetweenShifts= Math.floor(Math.random() * 5000) + 1500;
	}
	
	makeFood() {
		let food= null;
		if(this._healthy === true) {
			food= new HealthyFood(this);
		} else {
			food= new UnhealthyFood(this);
		}
		foods.push(food);
		food.display();
	}
}

class Player extends Entity {
	
	constructor() {
		super();
	}
	
	display() {
		this.top= window.innerHeight - this.height - innerHeight / window.innerHeight / 45;
		this.left= window.innerWidth / 2 - this.width / 2;
		
		this.score= 0;
		
		super.display(PLAYER_PATHS);
	}
	
	update() {
		if(this.moveLeft) {
			this.left-= PLAYER_SPEED;
			if(this.left <= LEFT_BOUND) {
				this.left= LEFT_BOUND;
			}
		} else if(this.moveRight) {
			this.left+= PLAYER_SPEED;
			if(this.right >= window.innerWidth - LEFT_BOUND) {
				this.left= window.innerWidth - LEFT_BOUND - this.width;
			}
		}
	}
}

function addToScore(score) {
	player.score+= score;
	document.getElementById("scoreLabel").innerText= player.score;
	if(player.score > targetScore) {
		let server= new Server(false, 1250);
		servers.push(server);
		server.display();
		targetScore= Math.floor(targetScore * 1.5);
		document.getElementById("addThrowerSound").play();
	} else {
		document.getElementById("addPointSound").play();
	}
}

function removeFood(food) {
	foods.splice(foods.indexOf(food), 1);
}

function endGame() {
	
	clearInterval(timer);
	
	player.clearDisplay();
	
	for(let i= servers.length - 1; i >= 2; i--) {
		servers[i].removeFromBody();
		servers.pop();
	}
	for(let server of servers) {
		server.clearDisplay();
	}
	
	for(let i= foods.length - 1; i >= 0; i--) {
		foods[i].removeFromBody();
		foods.pop();
	}
	
	document.getElementById("deathSound").play();
	document.getElementById("losingLabel").innerText= "Game Over!\nYou had a score of\n" + player.score;
	document.getElementById("playButton").style.display= "block";
	document.getElementById("scoreLabel").style.display= "";
}

function update() {
	player.update();
	
	for(let food of foods) {
		food.update();
	}
	
	for(let server of servers) {
		server.update();
	}
}

window.onkeydown= function(event) {
	let key= event.key.toUpperCase();
	if(key == "A") {
		player.moveLeft= true;
	} else if(key == "D") {
		player.moveRight= true;
	}
}

window.onkeyup= function(event) {
	let key= event.key.toUpperCase();
	if(key == "A") {
		player.moveLeft= false;
	} else if(key == "D") {
		player.moveRight= false;
	}
}

const PLAYER_PATHS= ["carterPlayer.png", "aeronePlayer.png", "kennyPlayer.png"];
const HEALTHY_FOOD_PATHS= [];
const UNHEALTHY_FOOD_PATHS= [];
const HEALTHY_SERVER_PATHS= [];
const UNHEALTHY_SERVER_PATHS= [];

const PLAYER_SPEED= window.innerWidth / 175;
const SERVER_SPEED= window.innerWidth / 175;
const MIN_FOOD_SPEED= window.innerHeight / 145;
const MAX_FOOD_SPEED= window.innerHeight / 115;


const ENTITY_WIDTH= window.innerWidth / 24;
const ENTITY_HEIGHT= window.innerHeight / 12;

const LEFT_BOUND= window.innerWidth / 20;

let player= new Player();
let servers= [new Server(true, 3000), new Server(false, 1000)];
let foods= [];
let targetScore= 10;

function playGame() {
	document.getElementById("playButton").style.display= "none";
	document.getElementById("losingLabel").innerText= "";
	document.getElementById("scoreLabel").innerText= "0";
	
	targetScore= 10;
	
	player.display();
	
	for(let server of servers) {
		server.display();
	}
	
	timer= setInterval(update, 1000 / 60);
}