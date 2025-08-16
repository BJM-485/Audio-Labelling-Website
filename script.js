document.addEventListener('DOMContentLoaded', () => {
    // State variables to manage the data and current position
    let labels = [];
    let currentIndex = 0;

    // DOM elements
    const mediaPlayerContainer = document.getElementById('mediaPlayerContainer');
    const labelContentDiv = document.getElementById('labelContent');
    const nextButton = document.getElementById('nextButton');

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
            console.log("Labels data fetched successfully:", labels);
            displayCurrentItem();
        } catch (error) {
            console.error("Could not fetch labels:", error);
            labelContentDiv.innerHTML = `<p class="text-red-500 text-center">Error loading labels: ${error.message}</p>`;
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
            // Create a video player
            mediaElement = document.createElement('video');
            mediaElement.className = 'w-full h-[480px] rounded-lg shadow-md object-contain';
        } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
            // Create an audio player
            mediaElement = document.createElement('audio');
            mediaElement.className = 'w-full h-12 rounded-lg shadow-md';
        } else {
            // Handle unsupported file types
            mediaPlayerContainer.innerHTML = `<p class="text-red-500 text-center p-4">Unsupported media type: ${fileExtension}</p>`;
            return;
        }
        
        mediaElement.controls = true;
        const sourceElement = document.createElement('source');
        sourceElement.src = mediaPath;
        sourceElement.type = `${mediaElement.tagName.toLowerCase()}/${fileExtension}`;
        
        mediaElement.appendChild(sourceElement);
        mediaPlayerContainer.appendChild(mediaElement);
        mediaElement.load();
    }

    /**
 * Renders a human-readable list of labels.
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

    // Process top-level keys
    for (const key in labelsObject) {
        if (labelsObject.hasOwnProperty(key)) {
            const value = labelsObject[key];
            
            if (Array.isArray(value)) {
                // Handle arrays like auto_transcript and sound_events
                html += `<h3 class="text-lg font-bold text-gray-800 mt-4 mb-2">${key.replace('_', ' ').toUpperCase()}</h3>`;
                html += `<ul class="list-disc pl-5 space-y-2">`;
                value.forEach(item => {
                    html += `<li>`;
                    for (const subKey in item) {
                        html += `<span><span class="font-semibold">${subKey}:</span> ${item[subKey]}</span> `;
                    }
                    html += `</li>`;
                });
                html += `</ul>`;
            } else if (typeof value === 'object' && value !== null) {
                // Handle nested objects like metadata
                html += `<h3 class="text-lg font-bold text-gray-800 mt-4 mb-2">${key.replace('_', ' ').toUpperCase()}</h3>`;
                html += `<ul class="list-disc pl-5 space-y-2">`;
                for (const subKey in value) {
                    html += createListItem(subKey, value[subKey]);
                }
                html += `</ul>`;
            } else {
                // Handle simple key-value pairs
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
        
        // Create the appropriate media player
        createMediaPlayer(currentItem.file_path);

        // Display the JSON data in a pre-formatted way
        renderLabels(currentItem);

        // The next button is always enabled now for looping
        nextButton.disabled = false;
        
        console.log(`Displaying item at index ${currentIndex}:`, currentItem);
    }

    /**
     * Handles the "Next" button click to move to the next item.
     */
    function handleNext() {
        // Increment the index, and loop back to 0 if we've reached the end
        currentIndex = (currentIndex + 1) % labels.length;
        displayCurrentItem();
    }

    // Add event listeners for the buttons
    nextButton.addEventListener('click', handleNext);

    // Initial fetch of the data when the page loads
    fetchLabels();
});