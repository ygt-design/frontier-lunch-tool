// drawing.js

// Your Firebase configuration (use the same config from your index page)
const firebaseConfig = {
  apiKey: "AIzaSyBLI06FwokeKaVYdrDElTtK2VCxYrmGO1U",
  authDomain: "drawing-game-c8e2f.firebaseapp.com",
  projectId: "drawing-game-c8e2f",
  storageBucket: "drawing-game-c8e2f.firebasestorage.app",
  messagingSenderId: "632325600521",
  appId: "1:632325600521:web:7499a63f150007fbe00fd8",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let strokes = []; // Array to hold all completed strokes
let currentStroke = null; // Current stroke object
let strokeStartTime = 0; // Time when current stroke started
let canvas;

// Brush settings (default values)
let brushSize = 20;
let brushColor = "#000000";

// Update brush settings from controls
document.getElementById("brushSize").addEventListener("input", function (e) {
  brushSize = parseInt(e.target.value);
});
document.getElementById("brushColor").addEventListener("input", function (e) {
  brushColor = e.target.value;
});

function setup() {
  canvas = createCanvas(600, 400);
  canvas.parent("canvas-container");
  background(255);
  // Use CENTER mode so squares are drawn centered on the cursor
  rectMode(CENTER);
  // Although strokeCap(SQUARE) works for lines, here we are drawing rectangles directly
}

function draw() {
  // No continuous drawing; drawing happens on mouse events.
}

function mousePressed() {
  strokeStartTime = millis();
  // Start a new stroke and clear any potential redo stack (if implemented earlier)
  currentStroke = {
    settings: {
      size: brushSize,
      color: brushColor,
    },
    points: [], // Points will be stored as { x, y, t }
  };
}

function mouseDragged() {
  // Set fill color for the square brush
  fill(currentStroke.settings.color);
  noStroke();

  // Draw a square (rectangle) at the current mouse position.
  // This square is axis-aligned (no rotation) because we use rect() without any rotation.
  rect(
    mouseX,
    mouseY,
    currentStroke.settings.size,
    currentStroke.settings.size
  );

  // Record the point with a timestamp relative to stroke start
  let t = millis() - strokeStartTime;
  currentStroke.points.push({ x: mouseX, y: mouseY, t: t });
}

function mouseReleased() {
  if (currentStroke && currentStroke.points.length > 0) {
    strokes.push(currentStroke);
  }
}

// Redraw the entire canvas from the recorded strokes (used for undo)
function redrawCanvas() {
  clear();
  background(255);
  for (let s of strokes) {
    fill(s.settings.color);
    noStroke();
    for (let pt of s.points) {
      rect(pt.x, pt.y, s.settings.size, s.settings.size);
    }
  }
}

// Undo button functionality: remove the last stroke and redraw
document.getElementById("undo").addEventListener("click", function () {
  if (strokes.length > 0) {
    strokes.pop();
    redrawCanvas();
  }
});

// Submit the drawing process (strokes) to Firebase
document
  .getElementById("submit-drawing")
  .addEventListener("click", function () {
    const username = localStorage.getItem("currentUsername");
    if (!username) {
      alert("No username found. Please go back and enter your name.");
      return;
    }
    database
      .ref("drawings/" + username)
      .set({
        strokes: strokes,
      })
      .then(() => {
        alert("Drawing process submitted successfully!");
        window.location.href = "../gallery/gallery.html";
      })
      .catch((error) => {
        console.error("Error saving drawing process: ", error);
      });
  });
