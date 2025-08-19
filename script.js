document.addEventListener('DOMContentLoaded', () => {
    // State variables to manage the data and current position
    let labels = [];
    let currentIndex = 0;

    // DOM elements
    const mediaPlayerContainer = document.getElementById('mediaPlayerContainer');
    const labelContentDiv = document.getElementById('labelContent');
    const nextButton = document.getElementById('nextButton');
    const downloadButton = document.getElementById('downloadButton');

    /**
     * Fetches the JSON data from the specified path.
     * @returns {Promise<Array>} A promise that resolves with the labels data.
     */
    async function fetchLabels() {
        try {
            const response = await fetch('data/labels.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            labels = await response.json();
            console.log("Labels fetched from JSON file.");
            displayCurrentItem();
        } catch (error) {
            console.error("Could not fetch labels:", error);
            labelContentDiv.innerHTML = `<p class="text-red-500 text-center">Error loading labels: ${error.message}</p>`;
            labels = [];
        }
    }
    
    /**
     * Creates and displays the appropriate media player based on the file type.
     * @param {string} mediaPath - The path to the media file.
     */
    function createMediaPlayer(mediaPath) {
        mediaPlayerContainer.innerHTML = ''; // Clear existing player
        const fileExtension = mediaPath.split('.').pop().toLowerCase();
        let mediaElement;

        if (['mp4', 'mov', 'webm'].includes(fileExtension)) {
            mediaElement = document.createElement('video');
            mediaElement.className = 'w-full h-auto rounded-lg shadow-md';
        } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
            mediaElement = document.createElement('audio');
            mediaElement.className = 'w-full rounded-lg shadow-md';
        } else {
            mediaPlayerContainer.innerHTML = `<p class="text-red-500 text-center p-4">Unsupported media type: ${fileExtension}</p>`;
            return;
        }
        
        mediaElement.controls = true;
        mediaElement.src = mediaPath;
        mediaPlayerContainer.appendChild(mediaElement);
    }
    
    /**
     * Renders a human-readable table for arrays.
     * @param {Array} data - The array of objects to render.
     * @param {string} title - The title for the table.
     * @param {boolean} isEditable - Whether to make certain cells editable.
     * @param {string} type - The type of data ('transcript' or 'events').
     */
    function renderTable(data, title, isEditable = false, type) {
        if (!data || data.length === 0) {
            return `<p class="text-gray-500 text-sm">No entries found for ${title}.</p>`;
        }

        // Define the desired header order based on the data type
        let orderedHeaders = [];
        const originalHeaders = Object.keys(data[0]).filter(header => header !== 'confidence');
        
        if (type === 'transcript') {
            // Re-order headers for transcript
            const otherHeaders = originalHeaders.filter(h => h !== 'start_time' && h !== 'end_time');
            orderedHeaders = ['start_time', 'end_time', ...otherHeaders];
        } else if (type === 'events') {
            // Re-order headers for events
            const otherHeaders = originalHeaders.filter(h => h !== 'start_time' && h !== 'end_time');
            orderedHeaders = ['start_time', 'end_time', ...otherHeaders];
        } else {
            orderedHeaders = originalHeaders;
        }

        let tableHtml = `
            <div class="overflow-x-auto">
                <h3 class="text-lg font-bold text-gray-800 mt-4 mb-2">${title.replace('_', ' ').toUpperCase()}</h3>
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg">
                    <thead class="bg-gray-200">
                        <tr>
                            ${orderedHeaders.map(header => `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">${header.replace('_', ' ')}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${data.map((item, itemIndex) => `
                            <tr data-type="${type}" data-index="${itemIndex}">
                                ${orderedHeaders.map(header => {
                                    const cellValue = item[header];
                                    const isEditableField = isEditable && (header === 'text' || header === 'tag');
                                    
                                    if (isEditableField) {
                                        return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                            <textarea
                                                class="w-full h-auto min-h-[50px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                data-header="${header}"
                                            >${cellValue}</textarea>
                                        </td>`;
                                    }
                                    return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${cellValue}</td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        return tableHtml;
    }

    /**
     * Renders the labels object into a human-readable view.
     * @param {Object} labelsObject - The JSON object for the current media file.
     */
    function renderLabels(labelsObject) {
        let html = '';

        // Helper function to create a list item
        const createListItem = (key, value) => `
            <li class="mb-2">
                <span class="font-semibold text-gray-700">${key}:</span>
                <span class="text-gray-900">${value}</span>
            </li>`;

        for (const key in labelsObject) {
            if (labelsObject.hasOwnProperty(key)) {
                const value = labelsObject[key];
                
                if (key === 'auto_transcript') {
                    html += renderTable(value, 'Auto Transcript', true, 'transcript');
                } else if (key === 'sound_events') {
                    html += renderTable(value, 'Sound Events', true, 'events');
                } else if (typeof value === 'object' && value !== null) {
                    html += `<h3 class="text-lg font-bold text-gray-800 mt-4 mb-2">${key.replace('_', ' ').toUpperCase()}</h3>`;
                    html += `<ul class="list-disc pl-5 space-y-2">`;
                    for (const subKey in value) {
                        html += createListItem(subKey, value[subKey]);
                    }
                    html += `</ul>`;
                } else {
                    html += createListItem(key.replace('_', ' '), value);
                }
            }
        }
        labelContentDiv.innerHTML = `<ul class="space-y-4">${html}</ul>`;
    }

    /**
     * Displays the media and label for the current item in the queue.
     */
    function displayCurrentItem() {
        if (labels.length === 0) {
            mediaPlayerContainer.innerHTML = '<p class="text-center p-4">No media to display.</p>';
            labelContentDiv.innerHTML = '<p class="text-center p-4">No labels to display.</p>';
            return;
        }

        const currentItem = labels[currentIndex];
        
        // Use the new audio_file key from the JSON file
        createMediaPlayer(currentItem.audio_file);

        // Render the human-readable labels
        renderLabels(currentItem.label);

        nextButton.disabled = false;
        downloadButton.disabled = false;
        
        console.log(`Displaying item at index ${currentIndex}:`, currentItem);
    }
    
    /**
     * Updates the in-memory labels array with the current state of the editable tables.
     */
    function updateLabelsFromUI() {
        const currentItem = labels[currentIndex];
        const updatedTranscript = [];
        const updatedEvents = [];

        // Get updated transcript data
        const transcriptTextareas = document.querySelectorAll('tr[data-type="transcript"] textarea');
        transcriptTextareas.forEach(textarea => {
            const index = textarea.closest('tr').dataset.index;
            const originalItem = currentItem.label.transcript[index];
            updatedTranscript.push({
                ...originalItem,
                text: textarea.value
            });
        });

        // Get updated sound events data
        const eventTextareas = document.querySelectorAll('tr[data-type="events"] textarea');
        eventTextareas.forEach(textarea => {
            const index = textarea.closest('tr').dataset.index;
            const originalItem = currentItem.label.events[index];
            updatedEvents.push({
                ...originalItem,
                tag: textarea.value
            });
        });

        // Update the in-memory labels object
        currentItem.label.transcript = updatedTranscript;
        currentItem.label.events = updatedEvents;
    }

    /**
     * Handles the "Next" button click to move to the next item.
     */
    function handleNext() {
        // First, update the in-memory labels with any edits
        updateLabelsFromUI();

        // Increment the index, and loop back to 0 if we've reached the end
        currentIndex = (currentIndex + 1) % labels.length;
        displayCurrentItem();
    }
    
    /**
     * Handles the "Download Edited JSON" button click.
     */
    function handleDownload() {
        // First, update the in-memory labels with the latest edits
        updateLabelsFromUI();
        
        const finalJsonString = JSON.stringify(labels, null, 2);
        
        try {
            // Create a Blob from the JSON string
            const blob = new Blob([finalJsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create a temporary link element to trigger the download
            const a = document.createElement('a');
            a.href = url;
            a.download = `edited_labels.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log("JSON file prepared for download.");
        } catch (error) {
            const messageBox = document.createElement('div');
            messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-4 rounded-md shadow-lg z-50';
            messageBox.textContent = 'An error occurred during file download.';
            document.body.appendChild(messageBox);
            setTimeout(() => document.body.removeChild(messageBox), 3000);
            console.error(error);
        }
    }

    // Add event listeners for the buttons
    nextButton.addEventListener('click', handleNext);
    downloadButton.addEventListener('click', handleDownload);

    // Initial fetch of the data when the page loads
    fetchLabels();
});
