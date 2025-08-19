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

    // Render labels
    function renderLabels(labelsObject) {
        // Editable JSON
        let html = `
            <h3>Editable JSON</h3>
            <textarea id="editableJson" style="width:100%;height:200px;">${JSON.stringify(labelsObject, null, 2)}</textarea>
        `;

        // Auto transcript (start, end, text)
        if (Array.isArray(labelsObject.auto_transcript)) {
            html += `
                <h3>Auto Transcript</h3>
                <table border="1" cellpadding="5">
                    <tr><th>Start</th><th>End</th><th>Text</th></tr>
                    ${labelsObject.auto_transcript.map(t => `
                        <tr>
                            <td>${t.start_time}</td>
                            <td>${t.end_time}</td>
                            <td>${t.text}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        }

        // Sound events (start, end, label)
        if (Array.isArray(labelsObject.sound_events)) {
            html += `
                <h3>Sound Events</h3>
                <table border="1" cellpadding="5">
                    <tr><th>Start</th><th>End</th><th>Label</th></tr>
                    ${labelsObject.sound_events.map(s => `
                        <tr>
                            <td>${s.start_time}</td>
                            <td>${s.end_time}</td>
                            <td>${s.label}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        }

        labelContentDiv.innerHTML = html;
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
        // Save edits before moving
        const editedJson = document.getElementById('editableJson').value;
        try {
            labels[currentIndex] = JSON.parse(editedJson);
        } catch (e) {
            alert("Invalid JSON format. Please fix it before proceeding.");
            return;
        }

        currentIndex = (currentIndex + 1) % labels.length;
        displayCurrentItem();
    }

    // Handle Download JSON button
    function handleDownload() {
        // Save edits before downloading
        const editedJson = document.getElementById('editableJson').value;
        try {
            labels[currentIndex] = JSON.parse(editedJson);
        } catch (e) {
            alert("Invalid JSON format. Please fix it before downloading.");
            return;
        }

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
