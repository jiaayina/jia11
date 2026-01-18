let orchidText = "I'm an orchid";
let letters = [];
let positions = [];
let assignedLetters = [];
let frozenLetters = [];

// 放大镜参数
let magnifierRadius = 90;
let maxScale = 2.0;

// 配草系统
let grasses = [];
let grassWord = "orchid";
let grassesMerged = false;

// 网格系统
let gridSize = 300;
let gridCellSize = 30;
let gridX, gridY;

// 星星花瓣系统
let originalStars = [];
let clickedStars = [];

// 网格里的云朵
let scents = [];

// 手部识别
let video;
let handPose;
let hands = [];
let modelLoaded = false;

// 手部追踪
let handTracking = [];

// 满天星粒子系统
let sparkles = [];

// 摘星星系统
let starCaptures = [];
let throwTarget = null;
let throwTargetTimer = 0;

// 网格内捏合状态
let gridPinchState = false;
let lastGridPinchState = false;

// 点击冷却时间
let lastClickTime = 0;
let clickCooldown = 500;

// 模糊滤镜变量
let videoBlurAmount = 4;

// 星星速度系统
let minStarSpeed = 0.3;
let maxStarSpeed = 2.5;

// 星星消失系统 (2分钟 = 120秒 = 7200帧 at 60fps)
let starDecreaseTimer = 0;
let starDecreaseInterval = 7200;

// 五指手势系统
let fiveFingerHands = [];
let palmTimers = [];
let lastFiveFingerCount = 0;

// 花朵字母系统
let flowerLetters = [];
let flowerLetterIndex = 0;
let flowerText = "I am an orchid.";

// 四个花瓣区域
let flowerPositions = [
  {x: 420, y: 320, radius: 70, area: "right"},
  {x: 180, y: 320, radius: 60, area: "left"},
  {x: 300, y: 200, radius: 50, area: "top"},
  {x: 300, y: 300, radius: 30, area: "center"}
];

// 音效系统 - 在 preload() 之前声明
let starSounds = [];
let soundsLoaded = false;
let soundEnabled = true;
let successfulSounds = []; // 记录成功加载的音效索引

function preload() {
  console.log("preload() started");
  
  handPose = ml5.handPose({
    flipped: true,
    maxHands: 4,
    runtime: 'mediapipe',
    modelType: 'full'
  });
  
  // 预加载9个音效文件 - 增强版（容错）
  console.log("Loading 9 sound files...");
  for (let i = 1; i <= 9; i++) {
    let sound = loadSound(
      i + '.mp3',
      // 成功回调
      function() {
        console.log('✓ Sound ' + i + '.mp3 loaded successfully');
        successfulSounds.push(i - 1); // 记录成功加载的索引
        checkAllSoundsLoaded();
      },
      // 失败回调
      function(error) {
        console.error('✗ Failed to load sound ' + i + '.mp3');
        console.log('请检查文件：' + i + '.mp3');
        console.log('错误详情:', error);
        // 失败时也检查一次
        checkAllSoundsLoaded();
      }
    );
    starSounds.push(sound);
  }
  
  console.log("preload() completed, " + starSounds.length + " sounds queued");
}

// 检查所有音效是否加载完成（修改版 - 容错）
function checkAllSoundsLoaded() {
  // 等待一小段时间，确保所有加载都尝试过
  setTimeout(function() {
    if (successfulSounds.length > 0) {
      soundsLoaded = true;
      console.log('🎵 ' + successfulSounds.length + '/9 sounds loaded successfully!');
      console.log('可用音效索引:', successfulSounds);
      updateSoundStatus('🎵 ' + successfulSounds.length + '/9 Ready');
    } else {
      console.log('⚠️ No sounds loaded successfully');
      updateSoundStatus('⚠️ No sounds');
    }
  }, 1000);
}

// 更新音效状态显示
function updateSoundStatus(message) {
  let statusElement = document.getElementById('sound-status');
  if (statusElement) {
    statusElement.innerText = message;
  }
}

// 播放随机音效（修改版 - 只播放成功加载的音效）
function playRandomStarSound() {
  if (!soundEnabled || !soundsLoaded || successfulSounds.length === 0) {
    console.log("Cannot play sound - soundEnabled:", soundEnabled, 
                "soundsLoaded:", soundsLoaded, 
                "available sounds:", successfulSounds.length);
    return;
  }
  
  // 从成功加载的音效中随机选择
  let randomSuccessIndex = floor(random(0, successfulSounds.length));
  let soundIndex = successfulSounds[randomSuccessIndex];
  let sound = starSounds[soundIndex];
  
  if (sound && sound.isLoaded()) {
    try {
      // 如果正在播放，先停止
      if (sound.isPlaying()) {
        sound.stop();
      }
      
      // 设置音量（0.0 到 1.0）
      sound.setVolume(0.6);
      
      // 播放音效
      sound.play();
      
      console.log('🎵 Playing sound: ' + (soundIndex + 1) + '.mp3');
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  } else {
    console.log('Sound not loaded:', soundIndex + 1);
  }
}

function setup() {
  createCanvas(600, 600);
  
  gridX = (width - gridSize) / 2;
  gridY = (height - gridSize) / 2;
  
  video = createCapture(VIDEO, videoReady);
  video.size(640, 480);
  video.hide();
  
  for (let i = 0; i < orchidText.length; i++) {
    letters.push(orchidText[i]);
  }
  
  initializeFlowerPositions();
  initializeGrasses();
  initializeStars();
  
  for (let i = 0; i < flowerText.length; i++) {
    flowerLetters.push({
      char: flowerText[i],
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      visible: false,
      size: random(14, 22),
      rotation: random(TWO_PI),
      rotationSpeed: random(-0.03, 0.03),
      alpha: 0,
      targetAlpha: 255,
      colorR: random(200, 255),
      colorG: random(200, 255),
      colorB: random(200, 255),
      vx: 0,
      vy: 0,
      inFlowerRegion: false,
      flowerAreaIndex: -1
    });
  }
  
  console.log("setup() completed");
}

function videoReady() {
  handPose.detectStart(video, gotHands);
  modelLoaded = true;
  console.log("Hand recognition model loaded");
}

function initializeFlowerPositions() {
  positions = [];
  assignedLetters = [];
  frozenLetters = [];
  
  for (let i = 0; i < 180; i++) {
    let x = 420 + random(-70, 70);
    let y = 320 + random(-90, 90);
    positions.push([x, y]);
    assignedLetters.push(random(letters));
    frozenLetters.push(false);
  }
  
  for (let i = 0; i < 120; i++) {
    let x = 180 + random(-60, 60);
    let y = 320 + random(-70, 70);
    positions.push([x, y]);
    assignedLetters.push(random(letters));
    frozenLetters.push(false);
  }
  
  for (let i = 0; i < 80; i++) {
    let x = 300 + random(-50, 50);
    let y = 200 + random(-60, 60);
    positions.push([x, y]);
    assignedLetters.push(random(letters));
    frozenLetters.push(false);
  }
  
  for (let i = 0; i < 60; i++) {
    let x = 300 + random(-30, 30);
    let y = 300 + random(-30, 30);
    positions.push([x, y]);
    assignedLetters.push(random(letters));
    frozenLetters.push(false);
  }
}

function initializeGrasses() {
  grasses = [];
  for (let i = 0; i < 4; i++) {
    grasses.push({
      baseX: random(220, 380),
      baseY: random(250, 350),
      currentX: 0,
      currentY: 0,
      velX: 0,
      velY: 0,
      spring: 0.06,
      damping: 0.88,
      maxForce: 8,
      height: random(50, 70)
    });
  }
  
  for (let grass of grasses) {
    grass.currentX = grass.baseX;
    grass.currentY = grass.baseY - grass.height;
  }
}

function initializeStars() {
  let margin = 40;
  originalStars = [];
  
  for (let i = 0; i < 8; i++) {
    let speed = random(minStarSpeed, maxStarSpeed);
    let angle = random(TWO_PI);
    originalStars.push(createStar(
      random(margin, width - margin),
      random(margin, height - margin),
      cos(angle) * speed,
      sin(angle) * speed
    ));
  }
}

function createStar(x, y, speedX, speedY) {
  return {
    x: x,
    y: y,
    originalSpeedX: speedX,
    originalSpeedY: speedY,
    speedX: speedX,
    speedY: speedY,
    size: random(8, 15),
    petalCount: floor(random(4, 8)),
    alpha: 255,
    fading: false,
    fixed: false,
    fixedX: 0,
    fixedY: 0
  };
}

function gotHands(results) {
  hands = results;
  processHands();
}

function processHands() {
  handTracking = [];
  fiveFingerHands = [];
  
  for (let hand of hands) {
    let keypoints = hand.keypoints;
    let indexFinger = keypoints[8];
    let thumb = keypoints[4];
    let palm = keypoints[0];
    
    let handX = map(indexFinger.x, 0, video.width, 0, width);
    let handY = map(indexFinger.y, 0, video.height, 0, height);
    
    let thumbX = map(thumb.x, 0, video.width, 0, width);
    let thumbY = map(thumb.y, 0, video.height, 0, height);
    
    let palmX = map(palm.x, 0, video.width, 0, width);
    let palmY = map(palm.y, 0, video.height, 0, height);
    
    let pinchDist = dist(thumbX, thumbY, handX, handY);
    let isPinching = pinchDist < 40;
    let isPointing = checkPointing(hand);
    let isFiveFingers = checkFiveFingers(hand);
    
    handTracking.push({
      hand: hand,
      indexX: handX,
      indexY: handY,
      thumbX: thumbX,
      thumbY: thumbY,
      palmX: palmX,
      palmY: palmY,
      isPinching: isPinching,
      isPointing: isPointing,
      isFiveFingers: isFiveFingers,
      pinchDist: pinchDist
    });
    
    if (isFiveFingers) {
      fiveFingerHands.push({
        x: palmX,
        y: palmY,
        timestamp: millis()
      });
    }
  }
  
  detectGestures();
  processFiveFingerGestures();
}

function checkPointing(hand) {
  let wrist = hand.keypoints[0];
  let indexTip = hand.keypoints[8];
  let middleTip = hand.keypoints[12];
  let ringTip = hand.keypoints[16];
  let pinkyTip = hand.keypoints[20];
  
  let indexDist = dist(wrist.x, wrist.y, indexTip.x, indexTip.y);
  let middleDist = dist(wrist.x, wrist.y, middleTip.x, middleTip.y);
  let ringDist = dist(wrist.x, wrist.y, ringTip.x, ringTip.y);
  let pinkyDist = dist(wrist.x, wrist.y, pinkyTip.x, pinkyTip.y);
  
  return indexDist > 90 && middleDist < 80 && ringDist < 75 && pinkyDist < 70;
}

function checkFiveFingers(hand) {
  let keypoints = hand.keypoints;
  let thumb = keypoints[4];
  let index = keypoints[8];
  let middle = keypoints[12];
  let ring = keypoints[16];
  let pinky = keypoints[20];
  let wrist = keypoints[0];
  
  let thumbDist = dist(thumb.x, thumb.y, wrist.x, wrist.y);
  let indexDist = dist(index.x, index.y, wrist.x, wrist.y);
  let middleDist = dist(middle.x, middle.y, wrist.x, wrist.y);
  let ringDist = dist(ring.x, ring.y, wrist.x, wrist.y);
  let pinkyDist = dist(pinky.x, pinky.y, wrist.x, wrist.y);
  
  return thumbDist > 60 && indexDist > 90 && middleDist > 90 && ringDist > 85 && pinkyDist > 80;
}

function processFiveFingerGestures() {
  let currentTime = millis();
  
  lastFiveFingerCount = fiveFingerHands.length;
  
  for (let i = palmTimers.length - 1; i >= 0; i--) {
    palmTimers[i].duration = currentTime - palmTimers[i].startTime;
    
    let palmStillThere = fiveFingerHands.some(fh => 
      dist(fh.x, fh.y, palmTimers[i].x, palmTimers[i].y) < 50
    );
    
    if (!palmStillThere) {
      palmTimers.splice(i, 1);
    }
  }
  
  for (let fh of fiveFingerHands) {
    let existing = palmTimers.find(pt => 
      dist(pt.x, pt.y, fh.x, fh.y) < 50
    );
    
    if (!existing) {
      palmTimers.push({
        x: fh.x,
        y: fh.y,
        startTime: currentTime,
        duration: 0
      });
    }
  }
}

function detectGestures() {
  gridPinchState = false;
  
  for (let ht of handTracking) {
    let inGrid = (ht.indexX > gridX && ht.indexX < gridX + gridSize &&
                  ht.indexY > gridY && ht.indexY < gridY + gridSize);
    
    if (inGrid && ht.isPinching) {
      gridPinchState = true;
      break;
    }
  }
  
  if (gridPinchState && !lastGridPinchState) {
    grassesMerged = true;
  } else if (!gridPinchState && lastGridPinchState) {
    grassesMerged = false;
  }
  
  lastGridPinchState = gridPinchState;
  
  for (let ht of handTracking) {
    let outsideGrid = !(ht.indexX > gridX && ht.indexX < gridX + gridSize &&
                        ht.indexY > gridY && ht.indexY < gridY + gridSize);
    
    if (ht.isPointing && outsideGrid) {
      createSparkle(ht.indexX, ht.indexY);
      
      let currentTime = millis();
      if (currentTime - lastClickTime > clickCooldown) {
        let angle = random(TWO_PI);
        let speed = random(minStarSpeed, maxStarSpeed);
        let newStar = createStar(
          ht.indexX, 
          ht.indexY, 
          cos(angle) * speed, 
          sin(angle) * speed
        );
        clickedStars.push(newStar);
        lastClickTime = currentTime;
      }
    }
  }
  
  handleStarPicking();
}

function createSparkle(x, y) {
  if (frameCount % 3 === 0) {
    sparkles.push({
      x: x + random(-5, 5),
      y: y + random(-5, 5),
      vx: random(-1, 1),
      vy: random(-2, 0),
      size: random(3, 8),
      alpha: 200,
      color: random(['white', 'lightgreen', 'pink']),
      rotation: random(TWO_PI),
      rotationSpeed: random(-0.05, 0.05)
    });
  }
}

function handleStarPicking() {
  for (let i = starCaptures.length - 1; i >= 0; i--) {
    let capture = starCaptures[i];
    let handFound = false;
    
    for (let ht of handTracking) {
      if (ht.isPinching && 
          dist(ht.indexX, ht.indexY, capture.star.x, capture.star.y) < 60) {
        handFound = true;
        capture.star.x = ht.indexX;
        capture.star.y = ht.indexY;
        capture.star.speedX = 0;
        capture.star.speedY = 0;
        capture.handX = ht.indexX;
        capture.handY = ht.indexY;
        capture.isPinching = true;
        
        let inGrid = (ht.indexX > gridX && ht.indexX < gridX + gridSize &&
                      ht.indexY > gridY && ht.indexY < gridY + gridSize);
        capture.currentlyInGrid = inGrid;
        break;
      }
    }
    
    if (!handFound && capture.isPinching) {
      let inGrid = (capture.handX > gridX && capture.handX < gridX + gridSize &&
                    capture.handY > gridY && capture.handY < gridY + gridSize);
      
      if (inGrid) {
        // 检查是否在花朵区域
        let inFlowerRegion = false;
        let flowerAreaIndex = -1;
        
        for (let j = 0; j < flowerPositions.length; j++) {
          let fp = flowerPositions[j];
          if (dist(capture.handX, capture.handY, fp.x, fp.y) < fp.radius) {
            inFlowerRegion = true;
            flowerAreaIndex = j;
            break;
          }
        }
        
        if (inFlowerRegion) {
          releaseNextFlowerLetter(capture.handX, capture.handY, flowerAreaIndex);
        } else {
          releaseFloatingLetter(capture.handX, capture.handY);
        }
        
        // 音乐关键：在网格内释放星星时播放音效
        playRandomStarSound();
        
        createScentCloud(capture.handX, capture.handY);
        
        let originalIndex = originalStars.indexOf(capture.star);
        if (originalIndex > -1) {
          originalStars.splice(originalIndex, 1);
        }
        
        let clickedIndex = clickedStars.indexOf(capture.star);
        if (clickedIndex > -1) {
          clickedStars.splice(clickedIndex, 1);
        }
        
        throwTarget = {x: capture.handX, y: capture.handY};
        throwTargetTimer = 120;
      } else {
        capture.star.speedX = capture.star.originalSpeedX;
        capture.star.speedY = capture.star.originalSpeedY;
      }
      
      starCaptures.splice(i, 1);
    }
  }
  
  for (let ht of handTracking) {
    if (ht.isPinching) {
      let allStars = [...originalStars, ...clickedStars];
      
      for (let star of allStars) {
        if (star.fixed) continue;
        
        let d = dist(ht.indexX, ht.indexY, star.x, star.y);
        
        if (d < 60) {
          let alreadyCaptured = starCaptures.some(c => c.star === star);
          
          if (!alreadyCaptured) {
            let inGrid = (ht.indexX > gridX && ht.indexX < gridX + gridSize &&
                          ht.indexY > gridY && ht.indexY < gridY + gridSize);
            
            starCaptures.push({
              star: star,
              handX: ht.indexX,
              handY: ht.indexY,
              isPinching: true,
              currentlyInGrid: inGrid
            });
            break;
          }
        }
      }
    }
  }
}

function releaseNextFlowerLetter(x, y, flowerAreaIndex) {
  let currentIndex = flowerLetterIndex % flowerLetters.length;
  let letter = flowerLetters[currentIndex];
  
  letter.visible = true;
  letter.inFlowerRegion = true;
  letter.flowerAreaIndex = flowerAreaIndex;
  
  let fp = flowerPositions[flowerAreaIndex];
  
  let targetAngle = random(TWO_PI);
  let targetRadius = random(10, fp.radius - 10);
  letter.x = fp.x + cos(targetAngle) * targetRadius;
  letter.y = fp.y + sin(targetAngle) * targetRadius;
  letter.targetX = letter.x;
  letter.targetY = letter.y;
  
  letter.vx = 0;
  letter.vy = 0;
  letter.alpha = 255;
  
  letter.colorR = random(200, 255);
  letter.colorG = random(200, 255);
  letter.colorB = random(200, 255);
  
  flowerLetterIndex++;
  console.log("Flower letter released:", letter.char, "in area", flowerAreaIndex);
}

function releaseFloatingLetter(x, y) {
  let currentIndex = flowerLetterIndex % flowerLetters.length;
  let letter = flowerLetters[currentIndex];
  
  letter.visible = true;
  letter.inFlowerRegion = false;
  letter.flowerAreaIndex = -1;
  
  letter.x = constrain(x, gridX + 20, gridX + gridSize - 20);
  letter.y = constrain(y, gridY + 20, gridY + gridSize - 20);
  
  letter.targetX = constrain(x + random(-30, 30), gridX + 20, gridX + gridSize - 20);
  letter.targetY = constrain(y + random(-30, 30), gridY + 20, gridY + gridSize - 20);
  
  letter.vx = 0;
  letter.vy = 0;
  letter.rotationSpeed = random(-0.02, 0.02);
  letter.alpha = 0;
  
  letter.colorR = random(200, 255);
  letter.colorG = random(200, 255);
  letter.colorB = random(200, 255);
  
  flowerLetterIndex++;
  console.log("Floating letter released:", letter.char);
}

function createScentCloud(x, y) {
  scents.push({
    x: x + random(-40, 40),
    y: y + random(-40, 40),
    size: random(20, 40),
    alpha: 255,
    vx: random(-1.5, 1.5),
    vy: random(-1, -0.3)
  });
}

function updateStarsWithFiveFingerGesture() {
  for (let pt of palmTimers) {
    let allStars = [...originalStars, ...clickedStars];
    
    for (let star of allStars) {
      if (starCaptures.some(c => c.star === star)) continue;
      
      let d = dist(star.x, star.y, pt.x, pt.y);
      let influenceRadius = 250;
      
      if (d < influenceRadius) {
        if (pt.duration < 5000) {
          let angle = atan2(pt.y - star.y, pt.x - star.x);
          let force = map(d, 0, influenceRadius, 0.6, 0);
          star.speedX += cos(angle) * force;
          star.speedY += sin(angle) * force;
          star.fixed = false;
        } else {
          if (!star.fixed) {
            star.fixed = true;
            star.fixedX = star.x;
            star.fixedY = star.y;
            star.speedX = 0;
            star.speedY = 0;
          }
          star.x = star.fixedX + random(-0.5, 0.5);
          star.y = star.fixedY + random(-0.5, 0.5);
        }
      }
    }
  }
}

function draw() {
  drawVideoBackground();
  drawGridBackground();
  
  updateAndDrawStars();
  drawGrid();
  updateAndDrawScents();
  drawLettersWithFlicker();
  updateAndDrawGrasses();
  updateAndDrawSparkles();
  drawFlowerLetters();
  drawHandCursors();
  drawInstructions();
}

function drawVideoBackground() {
  push();
  
  let videoAspect = video.width / video.height;
  let canvasAspect = width / height;
  
  let drawWidth, drawHeight, offsetX, offsetY;
  
  if (videoAspect > canvasAspect) {
    drawHeight = height;
    drawWidth = height * videoAspect;
    offsetX = (width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = width;
    drawHeight = width / videoAspect;
    offsetX = 0;
    offsetY = (height - drawHeight) / 2;
  }
  
  translate(offsetX + drawWidth, offsetY);
  scale(-1, 1);
  
  drawingContext.filter = `blur(${videoBlurAmount}px)`;
  image(video, 0, 0, drawWidth, drawHeight);
  drawingContext.filter = 'none';
  
  pop();
}

function drawGridBackground() {
  push();
  for (let x = gridX; x < gridX + gridSize; x++) {
    let gray = map(x, gridX, gridX + gridSize, 200, 245);
    stroke(gray, 200);
    strokeWeight(1);
    line(x, gridY, x, gridY + gridSize);
  }
  pop();
}

function drawGrid() {
  stroke(150, 150, 150, 80);
  strokeWeight(1);
  noFill();
  
  for (let x = 0; x <= gridSize; x += gridCellSize) {
    line(gridX + x, gridY, gridX + x, gridY + gridSize);
  }
  
  for (let y = 0; y <= gridSize; y += gridCellSize) {
    line(gridX, gridY + y, gridX + gridSize, gridY + y);
  }
  
  noFill();
  stroke(120, 120, 120, 100);
  strokeWeight(2);
  rect(gridX, gridY, gridSize, gridSize);
}

function updateAndDrawStars() {
  starDecreaseTimer++;
  if (starDecreaseTimer > starDecreaseInterval) {
    starDecreaseTimer = 0;
    fadeOutThirtyPercentStars();
  }
  
  updateStarsWithFiveFingerGesture();
  
  for (let star of originalStars) {
    updateAndDrawStar(star);
  }
  
  for (let star of clickedStars) {
    updateAndDrawStar(star);
  }
}

function fadeOutThirtyPercentStars() {
  let allStars = [...originalStars, ...clickedStars];
  let count = Math.floor(allStars.length * 0.3);
  
  for (let i = 0; i < count && i < allStars.length; i++) {
    if (allStars[i] && !allStars[i].fading) {
      allStars[i].fading = true;
    }
  }
}

function updateAndDrawStar(star) {
  let isCaptured = starCaptures.some(c => c.star === star);
  
  if (isCaptured) {
    drawStarShape(star.x, star.y, star.size * 1.3, star.petalCount, star.alpha);
    return;
  }
  
  if (star.fading) {
    star.alpha -= 2;
    if (star.alpha <= 0) {
      let originalIndex = originalStars.indexOf(star);
      if (originalIndex > -1) {
        originalStars.splice(originalIndex, 1);
        return;
      }
      let clickedIndex = clickedStars.indexOf(star);
      if (clickedIndex > -1) {
        clickedStars.splice(clickedIndex, 1);
        return;
      }
    }
  }
  
  if (!star.fixed) {
    star.x += star.speedX;
    star.y += star.speedY;
    
    if (star.x > width || star.x < 0) star.speedX *= -1;
    if (star.y > height || star.y < 0) star.speedY *= -1;
  }
  
  let inGrid = (star.x > gridX && star.x < gridX + gridSize &&
                star.y > gridY && star.y < gridY + gridSize);
  
  if (!inGrid) {
    drawStarShape(star.x, star.y, star.size, star.petalCount, star.alpha);
  }
}

function drawStarShape(x, y, size, petalCount, alpha = 255) {
  push();
  translate(x, y);
  
  for (let j = 0; j < petalCount; j++) {
    let angle = (TWO_PI / petalCount) * j;
    rotate(angle);
    
    fill(180, 220, 180, alpha * 0.6);
    noStroke();
    
    let petalLength = size * 0.8;
    let petalWidth = size * 0.3;
    ellipse(petalLength * 0.5, 0, petalLength, petalWidth);
    
    rotate(-angle);
  }
  
  fill(200, 230, 200, alpha);
  noStroke();
  ellipse(0, 0, size * 0.3, size * 0.3);
  
  pop();
}

function updateAndDrawSparkles() {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    let s = sparkles[i];
    
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.1;
    s.alpha -= 3;
    s.rotation += s.rotationSpeed;
    
    push();
    translate(s.x, s.y);
    rotate(s.rotation);
    
    if (s.color === 'white') {
      fill(255, 255, 255, s.alpha);
    } else if (s.color === 'lightgreen') {
      fill(200, 255, 200, s.alpha);
    } else if (s.color === 'pink') {
      fill(255, 200, 220, s.alpha);
    }
    
    noStroke();
    
    for (let j = 0; j < 4; j++) {
      let angle = (TWO_PI / 4) * j;
      rotate(angle);
      ellipse(s.size * 0.2, 0, s.size * 0.8, s.size * 0.3);
      rotate(-angle);
    }
    
    pop();
    
    if (s.alpha <= 0) {
      sparkles.splice(i, 1);
    }
  }
}

function drawHandCursors() {
  for (let ht of handTracking) {
    let outsideGrid = !(ht.indexX > gridX && ht.indexX < gridX + gridSize &&
                        ht.indexY > gridY && ht.indexY < gridY + gridSize);
    
    if (ht.isFiveFingers) {
      continue;
    } else if (outsideGrid) {
      if (ht.isPointing) {
        drawStarShape(ht.indexX, ht.indexY, 10, 5);
      } else {
        noFill();
        stroke(255, 200, 100, 150);
        strokeWeight(2);
        ellipse(ht.indexX, ht.indexY, 15, 15);
      }
    } else {
      noFill();
      stroke(100, 200, 255, 150);
      strokeWeight(2);
      ellipse(ht.indexX, ht.indexY, 20, 20);
    }
    
    if (ht.isPinching) {
      noFill();
      stroke(255, 100, 100, 200);
      strokeWeight(3);
      ellipse(ht.indexX, ht.indexY, 30, 30);
    }
  }
}

function updateAndDrawScents() {
  for (let i = scents.length - 1; i >= 0; i--) {
    let scent = scents[i];
    
    scent.x += scent.vx;
    scent.y += scent.vy;
    scent.alpha -= 1.5;
    
    if (scent.x > gridX && scent.x < gridX + gridSize &&
        scent.y > gridY && scent.y < gridY + gridSize) {
      
      noStroke();
      fill(255, 255, 255, scent.alpha);
      ellipse(scent.x, scent.y, scent.size, scent.size * 0.6);
      ellipse(scent.x - scent.size * 0.3, scent.y, scent.size * 0.7, scent.size * 0.5);
      ellipse(scent.x + scent.size * 0.3, scent.y, scent.size * 0.7, scent.size * 0.5);
      
      fill(120, 120, 120, scent.alpha);
      textSize(10);
      textAlign(CENTER, CENTER);
      for (let j = 0; j < 3; j++) {
        let angle = random(TWO_PI);
        let r = scent.size * 0.8;
        text(random(letters), scent.x + cos(angle) * r, scent.y + sin(angle) * r);
      }
    }
    
    if (scent.alpha <= 0) scents.splice(i, 1);
  }
}

function drawFlowerLetters() {
  let interactX = mouseX;
  let interactY = mouseY;
  
  if (handTracking.length > 0) {
    interactX = handTracking[0].indexX;
    interactY = handTracking[0].indexY;
  }
  
  for (let letter of flowerLetters) {
    if (letter.visible) {
      if (letter.inFlowerRegion) {
        if (frameCount % 5 === 0) {
          letter.displayChar = random(letters);
        } else if (!letter.displayChar) {
          letter.displayChar = letter.char;
        }
        
        letter.alpha = 255;
        
        let d = dist(letter.x, letter.y, interactX, interactY);
        let inMagnifier = d < magnifierRadius;
        
        let scale = 1.0;
        let offsetX = 0;
        let offsetY = 0;
        
        if (inMagnifier) {
          scale = map(d, 0, magnifierRadius, maxScale, 1.0);
          let pushStrength = map(d, 0, magnifierRadius, 25, 0);
          let angle = atan2(letter.y - interactY, letter.x - interactX);
          offsetX = cos(angle) * pushStrength;
          offsetY = sin(angle) * pushStrength;
        }
        
        push();
        translate(letter.x + offsetX, letter.y + offsetY);
        textSize(letter.size * scale);
        textAlign(CENTER, CENTER);
        fill(letter.colorR, letter.colorG, letter.colorB, letter.alpha);
        noStroke();
        text(letter.displayChar, 0, 0);
        pop();
        
      } else {
        letter.rotation += letter.rotationSpeed;
        
        if (letter.alpha < letter.targetAlpha) {
          letter.alpha += 8;
        }
        
        letter.x = constrain(letter.x, gridX + 20, gridX + gridSize - 20);
        letter.y = constrain(letter.y, gridY + 20, gridY + gridSize - 20);
        
        let d = dist(letter.x, letter.y, interactX, interactY);
        let inMagnifier = d < magnifierRadius;
        
        let scale = 1.0;
        let offsetX = 0;
        let offsetY = 0;
        
        if (inMagnifier) {
          scale = map(d, 0, magnifierRadius, maxScale, 1.0);
          let pushStrength = map(d, 0, magnifierRadius, 25, 0);
          let angle = atan2(letter.y - interactY, letter.x - interactX);
          offsetX = cos(angle) * pushStrength;
          offsetY = sin(angle) * pushStrength;
        }
        
        push();
        translate(letter.x + offsetX, letter.y + offsetY);
        rotate(letter.rotation);
        
        fill(letter.colorR, letter.colorG, letter.colorB, letter.alpha);
        noStroke();
        textSize(letter.size * scale);
        textAlign(CENTER, CENTER);
        text(letter.char, 0, 0);
        
        pop();
      }
    }
  }
}

function drawLettersWithFlicker() {
  textAlign(CENTER, CENTER);
  noStroke();
  
  let interactX = mouseX;
  let interactY = mouseY;
  
  if (handTracking.length > 0) {
    interactX = handTracking[0].indexX;
    interactY = handTracking[0].indexY;
  }
  
  for (let i = 0; i < positions.length; i++) {
    let [originalX, originalY] = positions[i];
    
    let d = dist(originalX, originalY, interactX, interactY);
    let inMagnifier = d < magnifierRadius;
    
    if (inMagnifier) {
      frozenLetters[i] = true;
    } else if (frameCount % 30 === 0) {
      frozenLetters[i] = false;
    }
    
    if (!frozenLetters[i] && frameCount % 5 === 0) {
      assignedLetters[i] = random(letters);
    }
    
    let scale = 1.0;
    let offsetX = 0;
    let offsetY = 0;
    
    if (inMagnifier) {
      scale = map(d, 0, magnifierRadius, maxScale, 1.0);
      let pushStrength = map(d, 0, magnifierRadius, 30, 0);
      let angle = atan2(originalY - interactY, originalX - interactX);
      offsetX = cos(angle) * pushStrength;
      offsetY = sin(angle) * pushStrength;
    }
    
    push();
    translate(originalX + offsetX, originalY + offsetY);
    textSize(16 * scale);
    fill(frozenLetters[i] ? 100 : 160, frozenLetters[i] ? 100 : 160, frozenLetters[i] ? 100 : 160, frozenLetters[i] ? 255 : 180);
    text(assignedLetters[i], 0, 0);
    pop();
  }
}

function updateAndDrawGrasses() {
  let interactX = mouseX;
  let interactY = mouseY;
  
  if (handTracking.length > 0) {
    interactX = handTracking[0].indexX;
    interactY = handTracking[0].indexY;
  }
  
  if (throwTarget && throwTargetTimer > 0) {
    interactX = throwTarget.x;
    interactY = throwTarget.y;
    throwTargetTimer--;
    
    if (throwTargetTimer === 0) {
      throwTarget = null;
    }
  }
  
  if (grassesMerged) {
    let centerX = width / 2;
    let centerY = height / 2;
    
    for (let grass of grasses) {
      let dx = centerX - grass.currentX;
      let dy = centerY - grass.currentY;
      
      grass.velX = dx * 0.15;
      grass.velY = dy * 0.15;
      
      grass.currentX += grass.velX;
      grass.currentY += grass.velY;
      
      stroke(100, 150, 120);
      strokeWeight(3);
      line(grass.baseX, grass.baseY, grass.currentX, grass.currentY);
      
      drawOrchidOnStem(grass, 100, 150, 120);
    }
  } else {
    for (let grass of grasses) {
      let dx = interactX - grass.currentX;
      let dy = interactY - grass.currentY;
      let distance = dist(grass.currentX, grass.currentY, interactX, interactY);
      
      let influence = distance < 220 ? map(distance, 0, 220, 1, 0) : 0;
      
      let targetX = grass.currentX + dx * influence * 0.35;
      let targetY = grass.currentY + dy * influence * 0.35;
      
      let forceX = (targetX - grass.currentX) * grass.spring;
      let forceY = (targetY - grass.currentY) * grass.spring;
      
      let forceMag = dist(0, 0, forceX, forceY);
      if (forceMag > grass.maxForce) {
        forceX = (forceX / forceMag) * grass.maxForce;
        forceY = (forceY / forceMag) * grass.maxForce;
      }
      
      grass.velX = (grass.velX + forceX) * grass.damping;
      grass.velY = (grass.velY + forceY) * grass.damping;
      
      grass.currentX += grass.velX;
      grass.currentY += grass.velY;
      
      let colorVar = sin(frameCount * 0.02 + grass.baseX) * 20;
      let r = 60 + colorVar;
      let g = 120 + colorVar;
      let b = 80 + colorVar;
      
      stroke(r, g, b);
      strokeWeight(2);
      line(grass.baseX, grass.baseY, grass.currentX, grass.currentY);
      
      drawOrchidOnStem(grass, r, g, b);
    }
  }
}

function drawOrchidOnStem(grass, r, g, b) {
  push();
  noStroke();
  textSize(10);
  textAlign(CENTER, CENTER);
  
  for (let i = 0; i < grassWord.length; i++) {
    let t = (i + 1) / (grassWord.length + 1);
    let x = lerp(grass.baseX, grass.currentX, t);
    let y = lerp(grass.baseY, grass.currentY, t);
    
    let swayX = sin(frameCount * 0.06 + i * 0.5) * 4 * t + grass.velX * t * 0.8;
    let swayY = grass.velY * t * 0.8;
    
    let colorVar = sin(frameCount * 0.02 + i) * 20;
    fill(r + colorVar, g + colorVar, b + colorVar);
    text(grassWord[i], x + swayX, y + swayY);
  }
  pop();
}

function getVisibleLettersCount() {
  let count = 0;
  for (let letter of flowerLetters) {
    if (letter.visible) {
      count++;
    }
  }
  return count;
}

function isGrassMoving() {
  for (let grass of grasses) {
    if (abs(grass.velX) > 0.1 || abs(grass.velY) > 0.1) {
      return true;
    }
  }
  return false;
}

function drawInstructions() {
  push();
  fill(255, 255, 255, 230);
  noStroke();
  textSize(11);
  textAlign(CENTER);
  
  let visibleLetters = getVisibleLettersCount();
  
  if (starCaptures.length > 0) {
    textSize(14);
    text("Star captured - Release in flower area", width / 2, 28);
  } else if (visibleLetters > 0) {
    textSize(12);
    text("Letters appearing: " + visibleLetters + "/" + flowerLetters.length, width / 2, 28);
  } else if (throwTarget) {
    textSize(12);
    text("Grasses following star", width / 2, 28);
  } else if (grassesMerged) {
    textSize(12);
    text("Grasses merged", width / 2, 28);
  } else if (fiveFingerHands.length > 0) {
    let longestDuration = palmTimers.length > 0 ? Math.max(...palmTimers.map(pt => pt.duration)) : 0;
    if (longestDuration > 5000) {
      textSize(12);
      text("Stars frozen - Keep hand still", width / 2, 28);
    } else {
      textSize(12);
      text("Stars attracted - Hold 5s to freeze", width / 2, 28);
    }
  } else if (handTracking.length > 0) {
    textSize(11);
    text("Hand detected - Ready", width / 2, 28);
  } else {
    textSize(11);
    text("Show hand to camera", width / 2, 28);
  }
  
  textSize(9);
  textAlign(LEFT);
  fill(255, 255, 255, 200);
  
  let leftY = height - 100;
  let leftX = 10;
  text("Point outside - Create stars", leftX, leftY);
  leftY += 12;
  text("Pinch & drag - Grab stars", leftX, leftY);
  leftY += 12;
  text("Release in flower - Letter emerges", leftX, leftY);
  leftY += 12;
  text("Release in empty - Rotating letter", leftX, leftY);
  leftY += 12;
  text("Five fingers - Attract stars", leftX, leftY);
  leftY += 12;
  text("Hold hand still 5s - Freeze stars", leftX, leftY);
  
  textAlign(RIGHT);
  let rightY = height - 100;
  let rightX = width - 10;
  text("Stars outside: " + (originalStars.length + clickedStars.length), rightX, rightY);
  rightY += 12;
  text("Captured: " + starCaptures.length, rightX, rightY);
  rightY += 12;
  text("Letters shown: " + visibleLetters, rightX, rightY);
  rightY += 12;
  
  let grassStatus = grassesMerged ? "Merged" : (isGrassMoving() ? "Moving" : "Static");
  text("Grasses: " + grassStatus, rightX, rightY);
  rightY += 12;
  text("Five fingers: " + fiveFingerHands.length, rightX, rightY);
  
  pop();
}