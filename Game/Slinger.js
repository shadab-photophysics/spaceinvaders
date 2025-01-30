// Setup canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Preload sounds
const shootSound = new Audio('Sounds/lasers/1.wav');
const explosionSound = new Audio('Sounds/explosions/1.wav');
const enemyHitSound = new Audio('Sounds/explosions/1.wav');
const playerHitSound = new Audio('Sounds/explosions/2.wav');

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    width: 100,
    height: 100,
    speed: 8,
    dx: 0,
    lives: 3
};

// Bullet object
const bullets = [];
const bulletSpeed = 7;
const bulletWidth = 10;
const bulletHeight = 20;

// Explosion object
const explosions = [];
const explosionSpeed = 5;
const explosionFrameCount = 6;
let currentExplosionFrame = 0;
let explosionFrameDelay = 5;

// Enemy object
const enemies = [];
const enemyRows = 5;
const enemyCols = 10;
const enemySpeed = { x: 2, y: 30 };
let enemyDirection = 1;

// Enemy bullets
const enemyBullets = [];
const enemyBulletSpeed = 10;

// Score variable
let score = 0;
let gameRunning = false;
let gameOver = false;

// Background scrolling variables
let backgroundY = 0;

// Key press tracking
let rightPressed = false;
let leftPressed = false;

// Fire rate limiter (in milliseconds)
let lastShotTime = 0;
const shootCooldown = 500;

// Event listeners for key presses
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

// Background image
const backgroundImg = new Image();
backgroundImg.src = 'Sprites/SpaceBackground.jpg';

// Player image
const playerImg = new Image();
playerImg.src = 'Sprites/DSF.png';

// Enemy image
const enemyImg = new Image();
enemyImg.src = 'Sprites/Aunty.webp';

// Bullet image
const bulletImg = new Image();
bulletImg.src = 'Sprites/bullet.png';

// Explosion image (8 frames in a sprite sheet)
const explosionImg = new Image();
explosionImg.src = 'Sprites/explosion.png';

// Ensure the explosion sprite sheet is fully loaded before game starts
explosionImg.onload = () => {
    console.log('Explosion sprite sheet loaded');
};

// Key press handler
function keyDownHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = true;
    } else if (e.key == " " || e.key == "Spacebar") {
        shootBullet();
    }
}

function keyUpHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false;
    } else if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
}

// Scroll the background
function drawBackground() {
    ctx.drawImage(backgroundImg, 0, backgroundY, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, backgroundY - canvas.height, canvas.width, canvas.height);
    backgroundY += 1;
    if (backgroundY >= canvas.height) backgroundY = 0;
}

// Player movement
function movePlayer() {
    if (rightPressed && player.x < canvas.width - player.width) {
        player.x += player.speed;
    } else if (leftPressed && player.x > 0) {
        player.x -= player.speed;
    }
}

// Draw player
function drawPlayer() {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

// Bullet functionality
function shootBullet() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime < shootCooldown) return;

    lastShotTime = currentTime;
    shootSound.play();

    bullets.push({
        x: player.x + player.width / 2 - bulletWidth / 2,
        y: player.y,
        width: bulletWidth,
        height: bulletHeight
    });
}

// Draw bullets
function drawBullets() {
    bullets.forEach((b, i) => {
        b.y -= bulletSpeed;
        ctx.drawImage(bulletImg, b.x, b.y, b.width, b.height);

        if (b.y < 0) bullets.splice(i, 1);
    });
}

// Initialise enemies
function initEnemies() {
    enemies.length = 0;  // Clear the previous enemies before initializing new ones

    for (let r = 0; r < enemyRows; r++) {
        for (let c = 0; c < enemyCols; c++) {
            enemies.push({
                x: c * 60 + 50,
                y: r * 60 + 50,
                width: 40,
                height: 40
            });
        }
    }
}

// Draw enemies
function drawEnemies() {
    let hitEdge = false;
    enemies.forEach(e => {
        e.x += enemySpeed.x * enemyDirection;

        if (e.x + e.width > canvas.width || e.x < 0) hitEdge = true;

        ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
    });

    if (hitEdge) {
        enemies.forEach(e => e.y += enemySpeed.y);
        enemyDirection *= -1;
    }
}

// Enemy shooting
function enemyShoot() {
    if (Math.random() < 0.01) {
        const shooter = enemies[Math.floor(Math.random() * enemies.length)];
        if (shooter) {
            enemyBullets.push({
                x: shooter.x + shooter.width / 2,
                y: shooter.y + shooter.height,
                width: 5,
                height: 15
            });
        }
    }
}

// Draw enemy bullets
function drawEnemyBullets() {
    enemyBullets.forEach((b, i) => {
        b.y += enemyBulletSpeed;
        ctx.fillStyle = "yellow";
        ctx.fillRect(b.x, b.y, b.width, b.height);

        if (b.y > canvas.height) enemyBullets.splice(i, 1);
    });
}

// Explosion animation (for both player and enemy hits)
function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        frame: 0,
        delay: explosionFrameDelay
    });

    explosionSound.currentTime = 0;
    explosionSound.play();
}

// Draw explosion animation
function drawExplosions() {
    explosions.forEach((explosion, index) => {
        const frameWidth = explosionImg.width / explosionFrameCount;
        const frameHeight = explosionImg.height;

        if (explosion.frame < explosionFrameCount) {
            ctx.drawImage(explosionImg, explosion.frame * frameWidth, 0, frameWidth, frameHeight, explosion.x - 25, explosion.y - 25, 50, 50);
            explosion.frame++;

            if (explosion.frame >= explosionFrameCount) {
                explosions.splice(index, 1);
            }
        }
    });
}

// Collision detection
function checkCollisions() {
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                score += 10;
                createExplosion(e.x, e.y);
                enemyHitSound.play();
            }
        });
    });

    enemyBullets.forEach((b, bi) => {
        if (b.x < player.x + player.width && b.x + b.width > player.x && b.y < player.y + player.height && b.y + b.height > player.y) {
            enemyBullets.splice(bi, 1);
            player.lives -= 1;
            createExplosion(player.x, player.y);
            playerHitSound.play();

            if (player.lives <= 0) {
                gameOver = true;
                gameRunning = false;
                displayGameOverScreen();
            }
        }
    });
}

// Draw score and lives
function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Lives:`, canvas.width - 100, 30);

    for (let i = 0; i < player.lives; i++) {
        ctx.drawImage(playerImg, canvas.width - 60 - (i * 40), 30, 30, 30);
    }
}

// Game over screen and restart logic
function displayGameOverScreen() {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);

    ctx.font = "20px Arial";
    ctx.fillText("Press Enter to Restart", canvas.width / 2 - 100, canvas.height / 2 + 40);

    document.addEventListener('keydown', restartGame);
}

function restartGame(e) {
    if (e.key === 'Enter') {
        score = 0;
        player.lives = 3;
        bullets.length = 0;
        enemies.length = 0;
        enemyBullets.length = 0;
        gameOver = false;
        gameRunning = true;
        initEnemies();
        gameLoop();

        document.removeEventListener('keydown', restartGame);
    }
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;

    if (enemies.length === 0) {
        // All enemies destroyed, generate new enemies
        initEnemies();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    movePlayer();
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawEnemyBullets();
    drawExplosions();
    checkCollisions();
    drawHUD();
    enemyShoot();

    requestAnimationFrame(gameLoop);
}

// Start Game
gameRunning = true;
initEnemies();
gameLoop();
