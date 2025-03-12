// Sensory AI Script
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const summaryButton = document.getElementById('summaryButton');
const videoFeed = document.getElementById('videoFeed');
const summaryResult = document.getElementById('summaryResult');
const placeholderGif = "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif";

function formatSummary(text) {
  let lines = text.split(/\n+/).filter(line => line.trim() !== "");
  let formatted = "<ul>";
  for (let line of lines) {
    line = line.replace(/^[-*•\s]+/, "").trim();
    formatted += `<li>${line}</li>`;
  }
  formatted += "</ul>";
  return formatted;
}

startButton.addEventListener('click', function() {
  document.querySelectorAll('.robot .eye').forEach(eye => {
    eye.classList.remove('eyes-closed');
    eye.classList.add('eyes-open');
  });
  document.querySelector('.head').classList.add('ears-active');

  fetch('/start_camera', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
      videoFeed.src = '/video_feed';
      startButton.disabled = true;
      stopButton.disabled = false;
      videoFeed.style.border = `2px solid var(--primary)`;
    })
    .catch(error => console.error('Error starting camera:', error));
});

stopButton.addEventListener('click', function() {
  document.querySelectorAll('.robot .eye').forEach(eye => {
    eye.classList.remove('eyes-open');
    eye.classList.add('eyes-closed');
  });
  document.querySelector('.head').classList.remove('ears-active');

  fetch('/stop_camera', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
      videoFeed.src = placeholderGif;
      startButton.disabled = false;
      stopButton.disabled = true;
      videoFeed.style.border = 'none';
    })
    .catch(error => console.error('Error stopping camera:', error));
});

summaryButton.addEventListener('click', function() {
  const mouth = document.querySelector('.head .mouth');
  if (mouth) {
    mouth.classList.add('active');
  }
  
  summaryResult.innerHTML = '<div class="status-item"><i class="fas fa-spinner fa-spin"></i> Analyzing observations...</div>';
  
  fetch('/summary')
    .then(response => response.json())
    .then(data => {
      if(data.summary){
        let formattedSummary = formatSummary(data.summary);
        summaryResult.innerHTML = `
          <div class="status-item" style="margin-bottom: 1rem;">
            <i class="fas fa-clipboard-check"></i>
            Analysis Complete
          </div>
          ${formattedSummary}
        `;
      } else {
        summaryResult.innerHTML = `<div class="status-item" style="color: #ff5555;">
          <i class="fas fa-exclamation-triangle"></i>
          Error: ${data.error || 'Unknown error'}
        </div>`;
      }
      if (mouth) {
        mouth.classList.remove('active');
      }
    })
    .catch(error => {
      summaryResult.innerHTML = `<div class="status-item" style="color: #ff5555;">
        <i class="fas fa-exclamation-triangle"></i>
        Connection Error
      </div>`;
      if (mouth) {
        mouth.classList.remove('active');
      }
      console.error('Error generating summary:', error);
    });
});

// Robot Interaction Script
function sendClickEvent(part) {
  fetch('/clicked', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part: part })
  })
  .then(response => response.json())
  .then(data => console.log('Clicked event sent:', data))
  .catch(error => console.error('Error sending click event:', error));
}

window.addEventListener('DOMContentLoaded', () => {
  const head = document.querySelector('.head');
  const cap = document.querySelector('.cap');
  const neck = document.querySelector('.neck');
  const torso = document.querySelector('.torso');
  const arms = document.querySelectorAll('.arm');
  const legs = document.querySelectorAll('.leg');

  head.addEventListener('click', () => { sendClickEvent("head"); });
  
  cap.addEventListener('click', (e) => {
    e.stopPropagation();
    sendClickEvent("cap");
  });
  
  neck.addEventListener('click', () => { sendClickEvent("neck"); });
  torso.addEventListener('click', () => { sendClickEvent("torso"); });
  
  arms.forEach(arm => {
    if (arm.classList.contains('left')) {
      arm.addEventListener('click', () => { sendClickEvent("left arm"); });
    } else {
      arm.addEventListener('click', () => { sendClickEvent("right arm"); });
    }
  });
  
  legs.forEach(leg => {
    if (leg.classList.contains('left')) {
      leg.addEventListener('click', () => { sendClickEvent("left leg"); });
    } else {
      leg.addEventListener('click', () => { sendClickEvent("right leg"); });
    }
  });
});

document.addEventListener('mousemove', (e) => {
  const eyes = document.querySelectorAll('.robot .eye');
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  
  eyes.forEach(eye => {
    const eyeRect = eye.getBoundingClientRect();
    const eyeX = eyeRect.left + eyeRect.width / 2;
    const eyeY = eyeRect.top + eyeRect.height / 2;
    const angle = Math.atan2(mouseY - eyeY, mouseX - eyeX);
    const distance = Math.min(7, Math.hypot(mouseX - eyeX, mouseY - eyeY) / 50);
    
    eye.style.transform = `rotate(${angle}rad) scaleY(${1 + distance / 10})`;
  });
});

function randomBlink() {
  if(startButton.disabled) {
    const eyes = document.querySelectorAll('.robot .eye');
    const blinkDuration = 200;
    
    eyes.forEach(eye => {
      eye.style.height = '0px';
    });
    
    setTimeout(() => {
      eyes.forEach(eye => {
        eye.style.height = '15px';
      });
    }, blinkDuration);
  }
}

setInterval(randomBlink, Math.random() * 4000 + 2000);