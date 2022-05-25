import React, { useRef, useState, useEffect } from 'react';

export default function Home() {
  let rulesBtn, closeBtn, rules, canvas, ctx, ball, paddle, brickInfo, bricks, animationID;

  let score = 0;

  const brickRowCount = 9;
  const brickColumnCount = 5;
  const delay = 500; //delay to reset the game

  const [gameon, setGameOn] = useState(false)


  useEffect(() => {
    rules = document.getElementById('rules');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // Create ball props
    ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: 10,
      speed: 4,
      dx: 4,
      dy: -4,
      visible: true
    };

    // Create paddle props
    paddle = {
      x: canvas.width / 2 - 40,
      y: canvas.height - 20,
      w: 80,
      h: 10,
      speed: 8,
      dx: 0,
      visible: true
    };

    // Create brick props
    brickInfo = {
      w: 70,
      h: 20,
      padding: 10,
      offsetX: 45,
      offsetY: 60,
      visible: true
    };

    // Create bricks
    bricks = [];
    for (let i = 0; i < brickRowCount; i++) {
      bricks[i] = [];
      for (let j = 0; j < brickColumnCount; j++) {
        const x = i * (brickInfo.w + brickInfo.padding) + brickInfo.offsetX;
        const y = j * (brickInfo.h + brickInfo.padding) + brickInfo.offsetY;
        bricks[i][j] = { x, y, ...brickInfo };
      }
    }

    // Keyboard event handlers
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

  }, [])

  // Draw ball
  const drawBall = () => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fillStyle = ball.visible ? '#0095dd' : 'transparent';
    ctx.fill();
    ctx.closePath();
  }

  // Draw Paddle
  const drawPaddle = () => {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.fillStyle = paddle.visible ? '#0095dd' : 'transparent';
    ctx.fill();
    ctx.closePath();
  }

  // Draw Bricks
  const drawBricks = () => {
    bricks.forEach(column => {
      column.forEach(brick => {
        ctx.beginPath();
        ctx.rect(brick.x, brick.y, brick.w, brick.h);
        ctx.fillStyle = brick.visible ? '#0095dd' : 'transparent';
        ctx.fill();
        ctx.closePath();
      });
    });
  }

  // Draw Score
  function drawScore() {
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, canvas.width - 100, 30);
  }

  // Move Paddle
  const movePaddle = () => {

    paddle.x += paddle.dx;

    // Wall detection
    if (paddle.x + paddle.w > canvas.width) {
      paddle.x = canvas.width - paddle.w;
    }

    if (paddle.x < 0) {
      paddle.x = 0;
    }
  }

  // Move ball
  const moveBall = () => {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (right/left)
    if (ball.x + ball.size > canvas.width || ball.x - ball.size < 0) {
      ball.dx *= -1; // ball.dx = ball.dx * -1
    }

    // Wall collision (top/bottom)
    if (ball.y + ball.size > canvas.height || ball.y - ball.size < 0) {
      ball.dy *= -1;
    }

    // console.log(ball.x, ball.y);

    // Paddle collision
    if (
      ball.x - ball.size > paddle.x &&
      ball.x + ball.size < paddle.x + paddle.w &&
      ball.y + ball.size > paddle.y
    ) {
      ball.dy = -ball.speed;
    }

    // Brick collision
    bricks.forEach(column => {
      column.forEach(brick => {
        if (brick.visible) {
          if (
            ball.x - ball.size > brick.x && // left brick side check
            ball.x + ball.size < brick.x + brick.w && // right brick side check
            ball.y + ball.size > brick.y && // top brick side check
            ball.y - ball.size < brick.y + brick.h // bottom brick side check
          ) {
            ball.dy *= -1;
            brick.visible = false;

            increaseScore();
          }
        }
      });
    });

    // Hit bottom wall - Lose
    if (ball.y + ball.size > canvas.height) {
      showAllBricks();
      uploadHandler(canvas.toDataURL());
      alert("GAME OVER! score recorded at Cloudinary")
      score = 0;
    }
  }

  const increaseScore = () => {
    score++;

    if (score % (brickRowCount * brickColumnCount) === 0) {

      ball.visible = false;
      paddle.visible = false;

      //After 0.5 sec restart the game
      setTimeout(function () {
        showAllBricks();
        score = 0;
        paddle.x = canvas.width / 2 - 40;
        paddle.y = canvas.height - 20;
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.visible = true;
        paddle.visible = true;
      }, 3000)
    }
  }

  const showAllBricks = () => {
    bricks.forEach(column => {
      column.forEach(brick => (brick.visible = true));
    });
  }

  const draw = () => {
    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBall();
    drawPaddle();
    drawScore();
    drawBricks();
  }

  const startGame = () => {
    setGameOn(true);
    movePaddle();
    moveBall();

    // Draw everything
    draw();

    animationID = requestAnimationFrame(startGame);
  }

  const keyDown = (e) => {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
      paddle.dx = paddle.speed;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
      paddle.dx = -paddle.speed;
    }
  }

  const keyUp = (e) => {
    if (
      e.key === 'Right' ||
      e.key === 'ArrowRight' ||
      e.key === 'Left' ||
      e.key === 'ArrowLeft'
    ) {
      paddle.dx = 0;
    }
  }

  const uploadHandler = (base64) => {
    try {
      fetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ data: base64 }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data.data);
        });
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div>
      <div className="title">
        <h2>How To Play:</h2>
        <p>
          Use your right and left keys to move the paddle to bounce the ball up
          and break the blocks.
        </p>
        <p>If you miss the ball, your score and the blocks will reset.</p>
      </div>
      <div className="container">
        <canvas id="canvas" width="800" height="600"></canvas><br /><br />
        {gameon? <h2>Reload page to restart</h2>
        :
        <button onClick={startGame}>Start Game</button>
        }
      </div>
    </div>
  )
}
