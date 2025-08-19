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
            const response = await fetch('https://sayantikalaskar.github.io/Data-AkaiSpace/files/final_output.json');
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

    // Top-level info (not editable)
    html += `
        <h3 class="text-xl font-bold text-gray-900 mt-4 mb-2 border-b pb-1">File Information</h3>
        <ul class="list-disc pl-5 space-y-2">
            <li><span class="font-semibold text-gray-900">File ID:</span> <span class="font-mono text-gray-700">${labelsObject.file_id}</span></li>
            <li><span class="font-semibold text-gray-900">File Path:</span> <span class="font-mono text-gray-700">${labelsObject.file_path}</span></li>
            <li><span class="font-semibold text-gray-900">Detected Language:</span> <span class="font-mono text-gray-700">${labelsObject.detected_language}</span></li>
            ${labelsObject.metadata?.duration_seconds ? `<li><span class="font-semibold text-gray-900">Duration:</span> <span class="font-mono text-gray-700">${labelsObject.metadata.duration_seconds} sec</span></li>` : ''}
        </ul>
    `;

    // Auto transcript (editable)
    if (Array.isArray(labelsObject.auto_transcript)) {
        html += `
            <h3 class="text-xl font-bold text-gray-900 mt-4 mb-2 border-b pb-1">Auto Transcript</h3>
            <table class="min-w-full border border-gray-300 rounded-md">
                <thead class="bg-gray-200">
                    <tr>
                        <th class="px-4 py-2 text-left font-bold text-gray-900 uppercase text-sm">Start</th>
                        <th class="px-4 py-2 text-left font-bold text-gray-900 uppercase text-sm">End</th>
                        <th class="px-4 py-2 text-left font-bold text-gray-900 uppercase text-sm">Text</th>
                    </tr>
                </thead>
                <tbody>
                    ${labelsObject.auto_transcript.map((t, i) => `
                        <tr>
                            <td class="border px-4 py-2"><input type="text" value="${t.start_time}" data-section="auto_transcript" data-index="${i}" data-key="start_time" class="w-full border px-2 py-1 rounded font-mono text-gray-700"/></td>
                            <td class="border px-4 py-2"><input type="text" value="${t.end_time}" data-section="auto_transcript" data-index="${i}" data-key="end_time" class="w-full border px-2 py-1 rounded font-mono text-gray-700"/></td>
                            <td class="border px-4 py-2"><input type="text" value="${t.text}" data-section="auto_transcript" data-index="${i}" data-key="text" class="w-full border px-2 py-1 rounded text-gray-800"/></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Sound events (editable)
    if (Array.isArray(labelsObject.sound_events)) {
        html += `
            <h3 class="text-xl font-bold text-gray-900 mt-4 mb-2 border-b pb-1">Sound Events</h3>
            <table class="min-w-full border border-gray-300 rounded-md">
                <thead class="bg-gray-200">
                    <tr>
                        <th class="px-4 py-2 text-left font-bold text-gray-900 uppercase text-sm">Start</th>
                        <th class="px-4 py-2 text-left font-bold text-gray-900 uppercase text-sm">End</th>
                        <th class="px-4 py-2 text-left font-bold text-gray-900 uppercase text-sm">Label</th>
                    </tr>
                </thead>
                <tbody>
                    ${labelsObject.sound_events.map((s, i) => `
                        <tr>
                            <td class="border px-4 py-2"><input type="text" value="${s.start_time}" data-section="sound_events" data-index="${i}" data-key="start_time" class="w-full border px-2 py-1 rounded font-mono text-gray-700"/></td>
                            <td class="border px-4 py-2"><input type="text" value="${s.end_time}" data-section="sound_events" data-index="${i}" data-key="end_time" class="w-full border px-2 py-1 rounded font-mono text-gray-700"/></td>
                            <td class="border px-4 py-2"><input type="text" value="${s.label}" data-section="sound_events" data-index="${i}" data-key="label" class="w-full border px-2 py-1 rounded text-gray-800"/></td>
                        </tr>
                    `).join('')}
                </tbody>
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




