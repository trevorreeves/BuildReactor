import soundDefs from 'core/config/soundDefinitions'

// TODO: adds a CRUD layer on top of sounds stored in config.notifications.sounds.library

var sounds = [];

function init() {
    // TODO: subscribe to configuration changes and keep sounds array up to date.
}

function getSound(name) {
    var res = sounds.filter(function(soundInfo) {
        return soundInfo.name === name;
    });

    return res.length > 0 ? res[0] : null;
}

export default {
    getSound
};