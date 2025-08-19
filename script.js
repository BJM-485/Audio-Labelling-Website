document.addEventListener('DOMContentLoaded', () => {
    let labels = [];
    let currentIndex = 0;

    // DOM elements
    const mediaPlayerContainer = document.getElementById('mediaPlayerContainer');
    const labelContentDiv = document.getElementById('labelContent');
    const nextButton = document.getElementById('nextButton');
    const downloadButton = document.getElementById('downloadButton');

    // Fetch JSON data
    async function fetchLabels() {
        try {
            const response = await fetch('data/labels.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            labels = await response.json();
            displayCurrentItem();
        } catch (error) {
            console.error("Could not fetch labels:", error);
            labelContentDiv.innerHTML = `<p>Error loading labels: ${error.message}</p>`;
        }
    }

    // Create media player depending on file type
    function createMediaPlayer(mediaPath) {
        mediaPlayerContainer.innerHTML = '';
        const fileExtension = mediaPath.split('.').pop().toLowerCase();

        let mediaElement;
        if (['mp4', 'mov', 'webm'].includes(fileExtension)) {
            mediaElement = document.createElement('video');
            mediaElement.width = 400;
        } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
            mediaElement = document.createElement('audio');
        } else {
            mediaPlayerContainer.innerHTML = `<p>Unsupported media type: ${fileExtension}</p>`;
            return;
        }

        mediaElement.controls = true;
        mediaElement.src = mediaPath;
        mediaPlayerContainer.appendChild(mediaElement);
    }

    // Render editable tables
    function renderLabels(labelsObject) {
        let html = '';

        // Auto transcript table
        if (Array.isArray(labelsObject.auto_transcript)) {
            html += `
                <h3>Auto Transcript</h3>
                <table border="1" cellpadding="5">
                    <tr><th>Start</th><th>End</th><th>Text</th></tr>
                    ${labelsObject.auto_transcript.map((t, i) => `
                        <tr>
                            <td><input type="text" value="${t.start_time}" data-section="auto_transcript" data-index="${i}" data-key="start_time"/></td>
                            <td><input type="text" value="${t.end_time}" data-section="auto_transcript" data-index="${i}" data-key="end_time"/></td>
                            <td><input type="text" value="${t.text}" data-section="auto_transcript" data-index="${i}" data-key="text"/></td>
                        </tr>
                    `).join('')}
                </table>
            `;
        }

        // Sound events table
        if (Array.isArray(labelsObject.sound_events)) {
            html += `
                <h3>Sound Events</h3>
                <table border="1" cellpadding="5">
                    <tr><th>Start</th><th>End</th><th>Label</th></tr>
                    ${labelsObject.sound_events.map((s, i) => `
                        <tr>
                            <td><input type="text" value="${s.start_time}" data-section="sound_events" data-index="${i}" data-key="start_time"/></td>
                            <td><input type="text" value="${s.end_time}" data-section="sound_events" data-index="${i}" data-key="end_time"/></td>
                            <td><input type="text" value="${s.label}" data-section="sound_events" data-index="${i}" data-key="label"/></td>
                        </tr>
                    `).join('')}
                </table>
            `;
        }

        labelContentDiv.innerHTML = html;
    }

    // Collect edits from inputs into labels[currentIndex]
    function saveEdits() {
        const inputs = labelContentDiv.querySelectorAll('input');
        inputs.forEach(input => {
            const section = input.dataset.section;
            const idx = input.dataset.index;
            const key = input.dataset.key;
            labels[currentIndex][section][idx][key] = input.value;
        });
    }

    // Display current item
    function displayCurrentItem() {
        if (labels.length === 0) {
            mediaPlayerContainer.innerHTML = '<p>No media to display.</p>';
            labelContentDiv.innerHTML = '<p>No labels to display.</p>';
            return;
        }
        const currentItem = labels[currentIndex];
        createMediaPlayer(currentItem.file_path);
        renderLabels(currentItem);
    }

    // Handle Next button
    function handleNext() {
        saveEdits();
        currentIndex = (currentIndex + 1) % labels.length;
        displayCurrentItem();
    }

    // Handle Download JSON button
    function handleDownload() {
        saveEdits();
        const blob = new Blob([JSON.stringify(labels, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'labels.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Event listeners
    nextButton.addEventListener('click', handleNext);
    downloadButton.addEventListener('click', handleDownload);

    // Load data
    fetchLabels();
});
