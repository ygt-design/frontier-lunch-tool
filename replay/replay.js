// replay.js

// Firebase configuration (same as in other files)
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

// Parse query parameter to get the username
const params = new URLSearchParams(window.location.search);
const username = params.get("username");

if (!username) {
  alert("No drawing specified.");
}

// Retrieve the drawing process data (strokes) for this user
database
  .ref("drawings/" + username)
  .once("value")
  .then((snapshot) => {
    const data = snapshot.val();
    if (data && data.strokes) {
      // Store strokes data globally for use in the p5 sketch
      window.strokesData = data.strokes;
      // Initialize the p5.js sketch in instance mode
      new p5(replaySketch, "replay-container");
    } else {
      alert("No drawing data found for this user.");
    }
  })
  .catch((error) => {
    console.error("Error loading drawing data: ", error);
  });

// p5.js instance mode sketch for replaying the drawing process at 2× speed
const replaySketch = (p) => {
  let currentStrokeIndex = 0;
  let currentPointIndex = 0;
  let replayStartTime = 0;
  const strokesData = window.strokesData; // Array of strokes recorded earlier

  p.setup = function () {
    let canvas = p.createCanvas(600, 400);
    canvas.parent("replay-container");
    p.background(255);
    replayStartTime = p.millis();
  };

  p.draw = function () {
    // If no more strokes, do nothing.
    if (!strokesData || currentStrokeIndex >= strokesData.length) {
      return;
    }

    const strokeData = strokesData[currentStrokeIndex];
    // Each stroke's time is recorded relative to its start, so we use the elapsed time for this stroke.
    // Multiply elapsed time by 2 to replay at 2× speed.
    let elapsed = (p.millis() - replayStartTime) * 2;

    // Draw segments of the current stroke until the recorded time is reached
    while (
      currentPointIndex < strokeData.length &&
      strokeData[currentPointIndex].t <= elapsed
    ) {
      if (currentPointIndex > 0) {
        const prev = strokeData[currentPointIndex - 1];
        const curr = strokeData[currentPointIndex];
        p.stroke(0);
        p.strokeWeight(4);
        p.line(prev.x, prev.y, curr.x, curr.y);
      }
      currentPointIndex++;
    }

    // If finished with the current stroke, move on to the next and reset the timer
    if (currentPointIndex >= strokeData.length) {
      currentStrokeIndex++;
      currentPointIndex = 0;
      replayStartTime = p.millis();
    }
  };
};
