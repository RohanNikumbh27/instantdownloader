const ytdl = require('@distube/ytdl-core');

const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll as test, has high quality

async function debugFormats() {
    try {
        console.log('Fetching info for:', videoUrl);
        const info = await ytdl.getInfo(videoUrl);

        console.log('--- All Formats ---');
        info.formats.forEach(f => {
            console.log(`itag: ${f.itag}, container: ${f.container}, quality: ${f.qualityLabel}, hasVideo: ${f.hasVideo}, hasAudio: ${f.hasAudio}, codecs: ${f.codecs}`);
        });

        console.log('\n--- Video and Audio (Muxed) ---');
        const muxed = ytdl.filterFormats(info.formats, 'videoandaudio');
        muxed.forEach(f => {
            console.log(`itag: ${f.itag}, quality: ${f.qualityLabel}, container: ${f.container}`);
        });

        console.log('\n--- Video Only (Adaptive) ---');
        const videoOnly = ytdl.filterFormats(info.formats, 'videoonly');
        videoOnly.forEach(f => {
            console.log(`itag: ${f.itag}, quality: ${f.qualityLabel}, container: ${f.container}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

debugFormats();
