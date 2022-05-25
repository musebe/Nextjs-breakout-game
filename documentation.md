### Create a Nextjs Breakout game

##  Introduction
This article how Nextjs can be used to create a simple breakout game.

##  Codesandbox 
The final version of this project can be viewed on   [Codesandbox](/).

<CodeSandbox
title="webrtc"
id=" "
/>

You can find the full source code on my [Github](/) repo.

##  Prerequisites

Basic/entry-level knowledge and understanding of javascript and React/Nextjs.

##  Setting Up the Sample Project

Create your project root directory: `npx create-next-app breakoutgame`

Enter the directory: `cd breakoutgame`

In our game, we involve [Cloudinary](https://cloudinary.com/?ap=em) for the game's online storage feature. The site is where we store the final score.

Include [Cloudinary](https://cloudinary.com/?ap=em) in your project dependencies: `npm install cloudinary`

 
Use this [link](https://cloudinary.com/console) to create or log into your Cloudinary account. You will be provided with a dashboard containing the necessary environment variables for integration.

In your root directory, create a new file named `.env.local` and use the following guide to fill your dashboard's variables.
```
"pages/api/upload.js"


CLOUDINARY_CLOUD_NAME =

CLOUDINARY_API_KEY = 

CLOUDINARY_API_SECRET=

```

Restart your project: `npm run dev`.

Create another directory `pages/api/upload.js`.

Configure the environment keys and libraries.

```
"pages/api/upload.js"


var cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
```
Finally, add a handler function to execute Nextjs post request:
```
"pages/api/upload.js"


export default async function handler(req, res) {
    if (req.method === "POST") {
        let url = ""
        try {
            let fileStr = req.body.data;
            const uploadedResponse = await cloudinary.uploader.upload(
                fileStr,
                {
                    resource_type: "video",
                    chunk_size: 6000000,
                }
            );
        } catch (error) {
            res.status(500).json({ error: "Something wrong" });
        }

        res.status(200).json("backend complete");
    }
}
```
The above function will upload the request body containing media files to Cloudinary and return the file's Cloudinary link as a response    

We can now work on our front end.

Start by importing the necessary hooks in your `pages/index` directory:

```
"pages/index"

import React, { useRef, useState, useEffect } from 'react';

```

Declare the following variables inside the `Home` function. We will use them as we move on

```
    let rulesBtn, closeBtn, rules, canvas, ctx, ball, paddle, brickInfo, bricks, animationID;

    let score = 0;

    const brickRowCount = 9;
    const brickColumnCount = 5;
    const delay = 500; //delay to reset the game

```
Paste the following code in the Home function return statement. Don't worry about the undefined functions. We add them as we move on. Trace the css file from the Github repo.

```
return (
    <div className="container">
      <div id="rules" className="rules">
        <h2>How To Play:</h2>
        <p>
          Use your right and left keys to move the paddle to bounce the ball up
          and break the blocks.
        </p>
        <p>If you miss the ball, your score and the blocks will reset.</p>
      </div>
      <div className="row">
        <div className="column">
          <canvas id="canvas" width="800" height="600"></canvas>
          <button onClick={startGame}>Start Game</button>
        </div>
      </div>
    </div>
  )
```

Create a `useEffect` hook, start by refferencing the necessary DOM element. We will also assign the canvas context to the variable `ctx`.
 useEffect(() => {
    rules = document.getElementById('rules');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

 },[])

Everything about the game will be drawn inside the canvas. We however must first create the game components. We need to draw a ball, a paddle, a single brick as well as several brick blocks. Add the mentioned component's props to the `useEffect` hook.

```
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
```

Create the functions to draw the components.

```
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
```

The paddle should be able to move only left and right within the canvas.

```
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
```

Use the code below for ball movement. We set up the conditions for ball movement limits both horizontally and vertically and also its contact with the paddle. The player loses when the ball hits the bottom of the canvas. We also need to constantly update the canvas drawing on every frame using a function that runs over and over again. We will achieve this using the inbuilt javascript timing function `setInterval`. If the user loses, the will be an alert string message and the final canvas shall be sent to the `uploadHandler` function for download.

```
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
```

Add the following code to track and increase your scores:

```
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
```

Add the following function that ensures all the brick column blocks are visible

```
  const showAllBricks = () => {
    bricks.forEach(column => {
      column.forEach(brick => (brick.visible = true));
    });
}
```

The following code draws all the components inside the canvas

```
    const draw = () => {
        // clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBall();
        drawPaddle();
        drawScore();
        drawBricks();
    }
```

You can now use the code below to run the game

```
  const startGame = () => {
    movePaddle();
    moveBall();

    // Draw everything
    draw();

    animationID = requestAnimationFrame(startGame);
  }
```
However, we haven't configured the game keyboard instructions yet.

Use the following functions for your paddle movement

```
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
```

Remember to include the functions above's event listeners to your `useEffect` hook.

```
    // Keyboard event handlers
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);
```

Finally, use the code below to handle your backend upload 

```
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
```

Your game should look like shown below at this point:

![complete UI](https://res.cloudinary.com/dogjmmett/image/upload/v1653459254/ui_x7xh9s.png "complete UI").

That completes the game build. Ensure to go through the article to enjoy the experience.