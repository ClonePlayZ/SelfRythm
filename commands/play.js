const ytdl = require("ytdl-core");

const strings = require("../strings.json");
const utils = require("../utils");

/** 
 * @description Play a song
 * @param {Discord.Guild} guild The guild to play the song on, as a
 * @param song The song to be played
 */
function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if(!song){
        serverQueue.voiceChannel.leave();
        return queue.delete(guild.id);
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url), {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25
    })
    .on('finish', () => {
        if(serverQueue.loop === false) serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    })
    .on('error', error => {
        console.log(error)
    })
    

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

}


/** 
 * @description Play a song with the provided link
 * @param {Discord.Client} client the client thats runs the commands
 * @param {Discord.Message} message the command's message
 * @param {Array<String>}args args[0] must be a link
 */
module.exports.run = async (client, message, args) => {

    if(!args[0]) return message.channel.send(strings.noArgs);


    if(utils.isURL(args[0])){
        FUrl = args[0];
    } else {
        FUrl = await utils.getUrl(args)
    }

    let voiceChannel = message.member.voice.channel; 

    const serverQueue = queue.get(message.guild.id);

    const songInfo = await ytdl.getInfo(FUrl, {filter: "audioonly"});
    const song = {
        title: songInfo.videoDetails.title,
        duration: songInfo.videoDetails.lengthSeconds,
        url: FUrl
    }

    if(!serverQueue) {
        const queueConstruct = {
            textchannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
            loop: false
        };
        queue.set(message.guild.id, queueConstruct)
        queueConstruct.songs.push(song)

        if (voiceChannel != null) { 
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            message.channel.send(strings.startedPlaying.replace("SONG_TITLE", song.title).replace("url", song.url));
            play(message.guild, queueConstruct.songs[0]);
        } else {
            queue.delete(message.guild.id);
            return message.channel.send(strings.notInVocal);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(strings.songAddedToQueue.replace("SONG_TITLE", song.title).replace("url", song.url));
    }

    
};

module.exports.help = {
    name: 'play'
};