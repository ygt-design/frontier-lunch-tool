// script.js

// Your Firebase configuration (replace with your actual config from your Firebase project)
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

const nameForm = document.getElementById("name-form");
const usernameInput = document.getElementById("username");
const errorMsg = document.getElementById("error-msg");
const nameSection = document.getElementById("name-section");
const greetingSection = document.getElementById("greeting-section");
const greetingMessage = document.getElementById("greeting-message");
const startDrawingBtn = document.getElementById("start-drawing");

let currentUsername = "";

// Listen for form submission to check name uniqueness
nameForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (username === "") return;

  // Reference to where we'll store the drawing data for each user
  const userRef = database.ref("drawings/" + username);

  // Check if this name already exists in the database
  userRef
    .get()
    .then((snapshot) => {
      if (snapshot.exists()) {
        errorMsg.style.display = "block";
      } else {
        // Reserve the username with a placeholder value
        userRef.set({ placeholder: true });
        currentUsername = username;

        // Show greeting message with the user's name
        greetingMessage.textContent = `🖌️ HELLO ${currentUsername}, PUT ON YOUR PAINTING PANTS!`;
        nameSection.style.display = "none";
        greetingSection.style.display = "block";
      }
    })
    .catch((error) => {
      console.error("Error checking username: ", error);
    });
});

// When the user clicks "Start Drawing", pass the name to the drawing page
startDrawingBtn.addEventListener("click", function () {
  // Save the username to local storage so that the next page can use it
  localStorage.setItem("currentUsername", currentUsername);
  window.location.href = "./drawing/drawing.html"; // We will create drawing.html next
});
