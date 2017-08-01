import soundDefs from 'core/config/soundDefinitions'

// Notification settings...
const defaultNotifications = {
    cards : {
        enabled: true,
        showWhenDashboardActive: false,
        buildBroken: true,
        buildFixed: true,
        buildStarted: false,
        buildSuccessful: false,
        buildStillFailing: false
    },
    sounds : {
        library: Object.keys(soundDefs.bundled).map(key => soundDefs.bundled[key]), // all bundled sounds constitute the default library
        enabled: false,
        playWhenDashboardActive: true,
        rules : [
            {
                selector : {
                    server : '*',
                    group : '*',
                    build : '*'
                },
                events : {
                    buildBroken : soundDefs.bundled.SadTrombone.name,
                    buildFixed  : soundDefs.bundled.Applause.name,
                    buildStarted: soundDefs.bundled.Ping.name,
                    buildSuccessful : soundDefs.bundled.Applause.name,
                    buildStillFailing : soundDefs.bundled.Glitch.name
                }
            }
        ]
    }
};

export default {
    update(config = {}) {
        config.columns = config.columns || 2;

        config.fullWidthGroups = (typeof config.fullWidthGroups === 'boolean') ?
            config.fullWidthGroups : true;

        config.singleGroupRows = (typeof config.singleGroupRows === 'boolean') ?
            config.singleGroupRows : false;

        config.showCommits = (typeof config.showCommits === 'boolean') ?
            config.showCommits : true;

        config.showCommitsWhenGreen =
            (typeof config.showCommitsWhenGreen === 'boolean') ?
            config.showCommitsWhenGreen : false;

        config.theme = config.theme || 'dark';

        config.colorBlindMode = config.colorBlindMode || true;

        // handle the data migration from pre sound & card objects
        if (config.notifications && !config.notifications.cards) {
            config.notifications.cards = config.notifications;
            config.notifications.sounds = defaultNotifications.sounds;
            config.notifications = null;             
        }

        config.notifications = config.notifications || defaultNotifications;

        return config;
    }
};
