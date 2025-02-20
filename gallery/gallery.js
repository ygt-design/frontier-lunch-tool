// gallery.js

// Use the same Firebase configuration as before
const firebaseConfig = {
  apiKey: "AIzaSyBLI06FwokeKaVYdrDElTtK2VCxYrmGO1U",
  authDomain: "drawing-game-c8e2f.firebaseapp.com",
  projectId: "drawing-game-c8e2f",
  storageBucket: "drawing-game-c8e2f.firebasestorage.app",
  messagingSenderId: "632325600521",
  appId: "1:632325600521:web:7499a63f150007fbe00fd8",
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const galleryContainer = document.getElementById("gallery-container");

function loadGallery() {
  const drawingsRef = database.ref("drawings");

  drawingsRef.on("value", (snapshot) => {
    galleryContainer.innerHTML = ""; // Clear previous content

    snapshot.forEach((childSnapshot) => {
      const username = childSnapshot.key;
      const data = childSnapshot.val();

      if (data && data.strokes) {
        // Create a container for this drawing entry
        const drawingDiv = document.createElement("div");
        drawingDiv.classList.add("drawing-item");

        // Add a heading with the username
        const userHeading = document.createElement("h3");
        userHeading.textContent = username;
        drawingDiv.appendChild(userHeading);

        // Create a container for the replay canvas
        const replayContainer = document.createElement("div");
        replayContainer.classList.add("replay-canvas");
        // Give the container a unique id
        const uniqueId = "replay-" + username + "-" + Date.now();
        replayContainer.id = uniqueId;
        drawingDiv.appendChild(replayContainer);

        galleryContainer.appendChild(drawingDiv);

        // Instantiate a p5.js sketch to replay the drawing automatically
        new p5(createReplaySketch(data.strokes), uniqueId);
      }
    });
  });
}

// 1) Compute bounding box (min/max X/Y) for all points in the strokes
function computeBoundingBox(strokesData) {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  strokesData.forEach((stroke) => {
    stroke.points.forEach((pt) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });
  });

  // Handle edge case if there's only one point or no points
  if (minX === Infinity) {
    // No points
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  return { minX, maxX, minY, maxY };
}

// 2) Create a p5 replay sketch that scales & centers the drawing
function createReplaySketch(strokesData) {
  return function (p) {
    let currentStrokeIndex = 0;
    let currentPointIndex = 0;
    let replayStartTime = 0;

    // We'll compute the bounding box & scale in setup
    let bbox, boundingWidth, boundingHeight, scaleFactor;
    let offsetX, offsetY;

    p.setup = function () {
      // Minimal canvas; we will resize it immediately
      p.createCanvas(1, 1);

      // Parent container (square by CSS)
      const parent = p.canvas.parentElement;
      const parentRect = parent.getBoundingClientRect();
      const size = parentRect.width; // This is the width of the .replay-canvas container

      p.resizeCanvas(size, size);
      p.background(255);

      // Compute bounding box of all points
      bbox = computeBoundingBox(strokesData);
      boundingWidth = bbox.maxX - bbox.minX;
      boundingHeight = bbox.maxY - bbox.minY;

      // Avoid division by zero if bounding box is empty
      if (boundingWidth < 1) boundingWidth = 1;
      if (boundingHeight < 1) boundingHeight = 1;

      // Determine how much to scale so the entire drawing fits in the canvas
      // We use the smaller of width/height to preserve aspect ratio
      scaleFactor = Math.min(size / boundingWidth, size / boundingHeight);

      // We'll center the bounding box in the canvas after scaling
      // So we find the offset needed to put the bounding box in the middle
      const scaledWidth = boundingWidth * scaleFactor;
      const scaledHeight = boundingHeight * scaleFactor;
      offsetX = (size - scaledWidth) / 2;
      offsetY = (size - scaledHeight) / 2;

      replayStartTime = p.millis();
    };

    p.draw = function () {
      if (!strokesData || currentStrokeIndex >= strokesData.length) {
        return; // All strokes have been replayed
      }

      const strokeData = strokesData[currentStrokeIndex];
      // Multiply elapsed time by 2 for 2× playback speed
      const elapsed = (p.millis() - replayStartTime) * 2;

      // Replay points in the current stroke until the recorded timestamp is reached
      while (
        currentPointIndex < strokeData.points.length &&
        strokeData.points[currentPointIndex].t <= elapsed
      ) {
        p.noStroke();
        p.fill(strokeData.settings.color);

        const pt = strokeData.points[currentPointIndex];

        // -- SCALE & TRANSLATE THE POINT --
        // Translate the point so that minX/minY is at (0,0), then apply scale, then offset
        const x = (pt.x - bbox.minX) * scaleFactor + offsetX;
        const y = (pt.y - bbox.minY) * scaleFactor + offsetY;
        const brushSize = strokeData.settings.size * scaleFactor;

        // Draw the square brush
        p.rectMode(p.CENTER);
        p.rect(x, y, brushSize, brushSize);

        currentPointIndex++;
      }

      // If the current stroke is finished, move on to the next stroke
      if (currentPointIndex >= strokeData.points.length) {
        currentStrokeIndex++;
        currentPointIndex = 0;
        replayStartTime = p.millis();
      }
    };
  };
}

loadGallery();
