let currentProgress = 0;
let targetProgress = 0;
let pollingInterval = null;

window.onload = () => {
  checkIfPlantingActive();
};

async function checkIfPlantingActive() {
  try {
    const response = await fetch('http://localhost:5000/api/is_planting');
    if (!response.ok) throw new Error('Failed to check planting status');
    const data = await response.json();

    if (data.plantingActive) {
      document.getElementById('input-screen').classList.add('hidden');
      document.getElementById('planting-screen').classList.remove('hidden');
      startPollingProgress();
    } else {
      document.getElementById('input-screen').classList.remove('hidden');
      document.getElementById('planting-screen').classList.add('hidden');
    }
  } catch (error) {
    console.error('Error checking planting status:', error);
  }
}

function startPlanting() {
  const x = parseFloat(document.getElementById('x-dimension').value);
  const y = parseFloat(document.getElementById('y-dimension').value);
  const columnSeparation = parseFloat(document.getElementById('column-separation').value);
  const seedSpacing = parseFloat(document.getElementById('seed-spacing').value);
  const dispenseWater = document.getElementById('dispense-water').checked;

  clearInlineError();

  if (
    isNaN(x) || x <= 0 ||
    isNaN(y) || y <= 0 ||
    isNaN(columnSeparation) || columnSeparation <= 0 ||
    isNaN(seedSpacing) || seedSpacing <= 0
  ) {
    alert("Please enter positive values for all numeric fields.");
    return;
  }

  fetch('http://localhost:5000/api/start_planting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x, y, columnSeparation, seedSpacing, dispenseWater }),
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to start planting.');
    return response.json();
  })
  .then(data => {
    currentProgress = 0;
    targetProgress = 0;
    updateProgressBar();

    document.getElementById('input-screen').classList.add('hidden');
    document.getElementById('planting-screen').classList.remove('hidden');

    startPollingProgress();
  })
  .catch(error => {
    console.error('Error starting planting:', error);
    showInlineError("Unable to start planting. Please try again.");
  });
}

function stopPlanting() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  fetch('http://localhost:5000/api/stop_planting', { method: 'POST' })
    .then(() => {
      resetToHome();
    })
    .catch(err => {
      console.error('Error stopping planting:', err);
      resetToHome();
    });
}

function resetToHome() {
  document.getElementById('planting-screen').classList.add('hidden');
  document.getElementById('input-screen').classList.remove('hidden');

  document.getElementById('x-dimension').value = '';
  document.getElementById('y-dimension').value = '';
  document.getElementById('column-separation').value = '';
  document.getElementById('seed-spacing').value = '';
  document.getElementById('dispense-water').checked = false;

  currentProgress = 0;
  targetProgress = 0;
  updateProgressBar();


  hideErrorBox();
  clearInlineError();
}

function returnHome() {
  resetToHome();
}

async function fetchCurrentProgressFromAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/target_progress');
    if (!response.ok) throw new Error('Progress API failed.');
    const data = await response.json();

    if (typeof data.currentProgress === 'number' && typeof data.targetProgress === 'number') {
      currentProgress = data.currentProgress;
      targetProgress = data.targetProgress;
      updateProgressBar();

      if (currentProgress >= targetProgress) {
        plantingComplete();
      }
    }
  } catch (error) {
    console.error("Error fetching current progress:", error);
    showErrorBox();
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

function startPollingProgress() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(fetchCurrentProgressFromAPI, 1000);
}

function updateProgressBar() {
  if (!targetProgress || targetProgress <= 0) return;

  let progressPercent = (currentProgress / targetProgress) * 100;
  progressPercent = Math.min(Math.max(progressPercent, 0), 100);

  const progressBar = document.getElementById('progress');
  const leafIcon = document.getElementById('leaf-icon');

  progressBar.style.width = `${progressPercent}%`;

  const leafWidthPx = leafIcon.offsetWidth || 24;
  const progressBarWidthPx = progressBar.parentElement.offsetWidth || 300;

  let leafLeftPx = (progressPercent / 100) * progressBarWidthPx - (leafWidthPx / 2);
  leafLeftPx = Math.min(Math.max(leafLeftPx, 0), progressBarWidthPx - leafWidthPx);

  leafIcon.style.left = `${leafLeftPx}px`;

  if (progressPercent === 100) {
    progressBar.style.borderRadius = "15px";
  } else if (progressPercent === 0) {
    progressBar.style.borderRadius = "0 0 0 0";
  } else {
    progressBar.style.borderRadius = "15px 0 0 15px";
  }
}

function plantingComplete() {
  clearInterval(pollingInterval);
  pollingInterval = null;

  document.getElementById('planting-title').textContent = "Planting Complete!";
  document.getElementById('stop-button').classList.add('hidden');
  document.getElementById('return-home-button').classList.remove('hidden');
}

function showInlineError(message) {
  const errorElem = document.getElementById('inline-error');
  errorElem.textContent = message;
  errorElem.classList.remove('hidden');
}

function clearInlineError() {
  const errorElem = document.getElementById('inline-error');
  errorElem.textContent = '';
  errorElem.classList.add('hidden');
}

function showErrorBox() {
  document.getElementById('error-message').classList.remove('hidden');
}

function hideErrorBox() {
  document.getElementById('error-message').classList.add('hidden');
}
