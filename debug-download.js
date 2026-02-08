const ytdl = require('@distube/ytdl-core');
const fs = require('fs');

const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
// Use a shorter video or just grab a chunk

async function testDownload() {
    try {
        console.log('Starting download stream test...');
        const stream = ytdl(videoUrl, { quality: 'lowest' }); // use lowest for speed

        const file = fs.createWriteStream('test-video.mp4');

        stream.pipe(file);

        stream.on('response', (res) => {
            console.log('Response received with status:', res.statusCode);
        });

        stream.on('progress', (chunkLength, downloaded, total) => {
            console.log(`Progress: ${(downloaded / 1024).toFixed(2)} KB`);
            if (downloaded > 500 * 1024) { // stop after 500KB
                console.log('Download working. Stopping.');
                stream.destroy();
                process.exit(0);
            }
        });

        stream.on('end', () => {
            console.log('Download finished');
        });

        stream.on('error', (err) => {
            console.error('Stream error:', err);
        });

    } catch (error) {
        console.error('Setup error:', error);
    }
}

testDownload();
