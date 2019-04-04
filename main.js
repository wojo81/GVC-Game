/*
Created by Tyler Wojciechowski and Tyler Zega for
the Global Virtual Classroom
*/

class Entity {

	constructor() {
		this._image= new Image();

		this._image.style.position= "absolute";
		this._image.className= "unselectable";

		this._image.width= ENTITY_WIDTH;
		this._image.height= ENTITY_HEIGHT;

		this._image.style.top= "0px";
		this._image.style.left= "0px";

		this._image.style.display= "none";

		document.body.appendChild(this._image);
	}

	display(imagePaths) {
		let randomIndex1= Math.floor(Math.random() * imagePaths.length);

		if(imagePaths[randomIndex1] === "gordon.png") {
			getGordonQuote();
			chef = 0;
		} else if(imagePaths[randomIndex1] === "guy.png") {
			getGuyQuote();
			chef = 1;
		}
		
		this._image.src= "resources/" + imagePaths[randomIndex1];
		this._image.style.display= "block";
	}

	resize() {
		this._image.width= ENTITY_WIDTH;
		this._image.height= ENTITY_HEIGHT;
	}

	clearDisplay() {
		this._image.style.display= "none";
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
		this._speed= Math.random() * (MAX_FOOD_SPEED - MIN_FOOD_SPEED + 1) + MIN_FOOD_SPEED;
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

		this._healthy= healthy;
		this._timeBetweenDrops= timeBetweenDrops;
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
		
		this.genTimeBetweenShifts();
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
		this.highScore= getHighScore();
		document.getElementById("losingLabel").innerText=
			"High Score: " + this.highScore;
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

function getHighScore() {
	let highScore= localStorage.getItem("highscore");
	
	if(highScore === null) {
		return 0;
	}
	
	return highScore;
}

function addToScore(score) {
	player.score+= score;
	document.getElementById("scoreLabel").innerText= "Score: " + player.score;
	if(player.score == targetScore) {
		let server= new Server(false, 1750);
		servers.push(server);
		server.display();
		targetScore= Math.floor(targetScore * 1.5);
		if(chef === 0) {
			getGordonQuote();
		} else if(chef === 1) {
			getGuyQuote();
		}
	} else {
		document.getElementById("addPointSound").play();
	}
}

function removeFood(food) {
	foods.splice(foods.indexOf(food), 1);
}

function endGame() {

	playing= false;

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
	
	if(player.score > player.highScore) {
		player.highScore= player.score;
		localStorage.setItem("highscore", player.highScore);
	}
	
	document.getElementById("music").pause();
	document.getElementById("deathSound").play();
	document.getElementById("losingLabel").innerText=
		"Game Over!\nYou had a score of " + player.score
		+ "\n\nHigh Score: " + player.highScore;
	document.getElementById("playButton").style.display= "block";
	document.getElementById("scoreLabel").innerText= "";
}

function getGordonQuote() {
	let randomIndex2= Math.floor(Math.random() * GORDON_QUOTES.length);
			GORDON_QUOTES[randomIndex2].play();
}

function getGuyQuote() {
	let randomIndex2= Math.floor(Math.random() * GUY_QUOTES.length);
			GUY_QUOTES[randomIndex2].play();
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
};

window.onkeyup= function(event) {
	let key= event.key.toUpperCase();
	if(key == "A") {
		player.moveLeft= false;
	} else if(key == "D") {
		player.moveRight= false;
	}
};

window.ontouchstart= function(event) {
	let x= event.touches[0].clientX;

	if(x > window.innerWidth / 2) {
		player.moveLeft= false;
		player.moveRight= true;
	} else {
		player.moveRight= false;
		player.moveLeft= true;
	}
}

window.ontouchend= function(event) {
	player.moveLeft= false;
	player.moveRight= false;
}

window.onresize= function(event) {

	if(playing) {
		endGame();
	}

	PLAYER_SPEED= window.innerWidth / 175;
	SERVER_SPEED= window.innerWidth / 175;
	MIN_FOOD_SPEED= window.innerHeight / 145;
	MAX_FOOD_SPEED= window.innerHeight / 115;
	
	ENTITY_WIDTH= window.innerWidth / 24;
	ENTITY_HEIGHT= window.innerHeight / 12;
	
	LEFT_BOUND= window.innerWidth / 20;

	player.resize();
	for(let server of servers) {
		server.resize();
	}
}

const PLAYER_PATHS= ["carterPlayer.png", "aeronePlayer.png", "kennyPlayer.png", "montyPlayer.png", "jakePlayer.png"];
const HEALTHY_FOOD_PATHS= ["water.png", "apple.png", "carrot.png", "celery.png", "salad.png"];
const UNHEALTHY_FOOD_PATHS= ["burger.png", "chiliDog.png", "doritos.png", "fries.png", "mtnDew.png", "reeses.png"];
const HEALTHY_SERVER_PATHS= ["guy.png", "gordon.png"];
const UNHEALTHY_SERVER_PATHS= ["bk.png", "ronald.png"];

const GORDON_QUOTES= document.getElementById("gordonQuotes").children;
const GUY_QUOTES= document.getElementById("guyQuotes").children;
let chef = null;

let PLAYER_SPEED= window.innerWidth / 175;
let SERVER_SPEED= window.innerWidth / 175;
let MIN_FOOD_SPEED= window.innerHeight / 145;
let MAX_FOOD_SPEED= window.innerHeight / 115;

let ENTITY_WIDTH= window.innerWidth / 24;
let ENTITY_HEIGHT= window.innerHeight / 12;

let LEFT_BOUND= window.innerWidth / 20;

let playing= false;

let player= new Player();
let servers= [new Server(true, 3000), new Server(false, 1000)];
let foods= [];
let targetScore= 10;

function playGame() {
	document.getElementById("playButton").style.display= "none";
	document.getElementById("losingLabel").innerText= "";
	document.getElementById("scoreLabel").innerText= "Score: 0";
	document.getElementById("music").play();
	
	targetScore= 10;

	player.display();

	for(let server of servers) {
		server.display();
	}

	timer= setInterval(update, 1000 / 60);

	playing= true;
}
