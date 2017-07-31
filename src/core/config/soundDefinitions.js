var SoundEventTypes = {
    BuildBroken       : "buildBroken",
    BuildFixed        : "buildFixed",
    BuildStarted      : "buildStarted",
    BuildSuccessful   : "buildSuccessful",
    BuildStillFailing : "buildStillFailing",
    Unknown           : "unknown"
}

var SoundTypes = {
    Bundled : 'Bundled',
    Remote  : 'Remote'
};

class SoundInfo {
    constructor(name, src, type) {
        this.name = name;
        this.src = src;
        this.type = type;
    }
}

const bundled = {
    Ping        : new SoundInfo('Ping', 'sounds/ping.wav', SoundTypes.Bundled),
    SadTrombone : new SoundInfo('Sad Trombone', 'sounds/sad_trombone.wav', SoundTypes.Bundled),
    Applause    : new SoundInfo('Applause', 'sounds/Applause.wav', SoundTypes.Bundled),
    Glitch      : new SoundInfo('Glitch', 'sounds/glitch.wav', SoundTypes.Bundled)
}

export default {
    SoundEventTypes,
    SoundTypes,
    SoundInfo,
    bundled
};