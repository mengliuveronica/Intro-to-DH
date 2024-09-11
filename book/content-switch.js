function checkPassword(buttonId, contentId, correctPassword) {
    var passwordInput = document.getElementById(buttonId + "-input");
    var password = passwordInput.value;
    if (password === correctPassword) {
      document.getElementById(contentId).style.display = "block";
      document.getElementById(buttonId + "-section").style.display = "none";
    } else {
      alert("Incorrect password. Please try again.");
    }
  }

function createPasswordSection(buttonId, contentId, correctPassword) {
    var section = document.createElement("div");
    section.id = buttonId + "-section";
    
    var input = document.createElement("input");
    input.type = "password";
    input.id = buttonId + "-input";
    input.placeholder = "Enter password";
    
    var button = document.createElement("button");
    button.textContent = "View Content";
    button.onclick = function() { checkPassword(buttonId, contentId, correctPassword); };
    
    section.appendChild(input);
    section.appendChild(button);
    
    document.currentScript.parentNode.insertBefore(section, document.currentScript);
}

function toggleContent(buttonId, contentId) {
  var content = document.getElementById(contentId);
  var button = document.getElementById(buttonId);
  
  if (content.style.display === "none" || content.style.display === "") {
      content.style.display = "block";
      button.textContent = "Hide";
  } else {
      content.style.display = "none";
      button.textContent = "Show";
  }
}

function createToggleSection(buttonId, contentId) {
  var button = document.createElement("button");
  button.id = buttonId;
  button.textContent = "View Answer";
  button.onclick = function() { toggleContent(buttonId, contentId); };
  
  document.currentScript.parentNode.insertBefore(button, document.currentScript);
}