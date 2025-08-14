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
            const response = await fetch('Data/labels.json');
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
            mediaElement.className = 'w-full h-auto rounded-lg shadow-md';
        } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
            // Create an audio player
            mediaElement = document.createElement('audio');
            mediaElement.className = 'w-full rounded-lg shadow-md';
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
        labelContentDiv.innerHTML = `
            <pre class="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm"><code>${JSON.stringify(currentItem, null, 2)}</code></pre>
        `;

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