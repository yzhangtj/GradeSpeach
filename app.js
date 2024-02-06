document.getElementById('startButton').addEventListener('click', function() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(handleSuccess);
});

const handleSuccess = (stream) => {
    const options = { mimeType: 'audio/webm' };
    const recordedChunks = [];
    const mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.addEventListener('dataavailable', function(e) {
        if (e.data.size > 0) recordedChunks.push(e.data);
    });

    mediaRecorder.addEventListener('stop', function() {
    // Create the audio blob with the correct MIME type
    const audioBlob = new Blob(recordedChunks, { 'type' : 'audio/webm; codecs=opus' });
    sendAudioToServer(audioBlob);
});

    mediaRecorder.start();
    // Example: Stop recording after 5 seconds
    setTimeout(() => {
        mediaRecorder.stop();
    }, 5000);
};

const sendAudioToServer = (audioBlob) => {
    // Placeholder for sending audio to your server
    const formData = new FormData();
    formData.append('audioFile', audioBlob, 'userAudio.webm'); // The filename is set to 'userAudio.webm'

    fetch('http://127.0.0.1:5000/transcribe-audio', {
        method: 'POST',
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        const transcriptionElement = document.getElementById('transcription');
        const gradeElement = document.getElementById('grade');

        // If the transcription is successful and not an error message
        if (data.transcription && data.transcription !== "Could not transcribe audio.") {
            transcriptionElement.innerText = data.transcription;
            const gradeResult = compareAndGrade(data.transcription, document.getElementById('referenceText').innerText);
            gradeElement.innerText = `Your grade: ${gradeResult}`;
        } else {
            // Handle the case where transcription failed
            transcriptionElement.innerText = "No transcription available.";
            gradeElement.innerText = "Unable to grade transcription.";
        }
    })
    .catch(error => {
        console.error('Error transcribing audio: ', error);
        document.getElementById('transcription').innerText = "Error transcribing audio.";
        document.getElementById('grade').innerText = "";
    });


};

const levenshteinDistance = (a, b) => {
    const matrix = [];

    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // Substitution
                    matrix[i][j - 1] + 1, // Insertion
                    matrix[i - 1][j] + 1 // Deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

const compareAndGrade = (transcribedText, referenceText) => {
    const distance = levenshteinDistance(transcribedText.trim().toLowerCase(), referenceText.trim().toLowerCase());
    const length = Math.max(transcribedText.length, referenceText.length);
    const similarity = (1 - distance / length) * 100;
    const score = similarity < 0 ? 0 : similarity;  // Ensure the score is not negative

    return `${score.toFixed(2)}% Similarity (Levenshtein distance: ${distance})`;
};
