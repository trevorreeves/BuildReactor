/* global chrome: false, Notification: false */
import 'rx/dist/rx.time';
import Rx from 'rx';
import chromeApi from 'common/chromeApi';
import events from 'core/events';
import soundDefs from 'core/config/soundDefinitions'
import soundDriver from 'core/soundDriver'
import soundLibrary from 'core/soundLibrary'

function init(options) {

    let config = {};
    options.configuration.subscribe((newConfig) => {
        config = newConfig;
    });

    function whenDashboardInactive(event) {
        return config.notifications.sounds.playWhenDashboardActive ?
            Rx.Observable.return(event) :
            chromeApi
                .isDashboardActive()
                .where((active) => !active)
                .select(() => event);
    }

    function mapEventToSoundEvent(event) {
        var soundEvent = {
                type : soundDefs.SoundEventTypes.Unknown,
                buildServerName : event.source,
                buildName : event.name,
                buildGroupName : event.group
            };

        if (event.eventName === 'buildFinished')
        {
            if (event.broken) {
                soundEvent.type = soundDefs.SoundEventTypes.BuildBroken; 
            }
            else if (event.fixed) {
                soundEvent.type = soundDefs.SoundEventTypes.BuildFixed;
            }
            else if (!event.details.isBroken) {
                soundEvent.type = soundDefs.SoundEventTypes.BuildSuccessful;
            }
            else if (event.details.isBroken) {
                soundEvent.type = soundDefs.SoundEventTypes.BuildStillFailing;
            }
        }

        else if (event.eventName === 'buildStarted') {
            soundEvent.type = soundDefs.SoundEventTypes.BuildStarted;
        }

        return soundEvent;
    }

    function mapSoundEventToSound(soundEvent)
    {
        // get the sound settings for the context of the event
        // ...for now, settings apply to all builds in the app...
        var contextSoundSettings = config.notifications.sounds.events;

        var eventSetting = contextSoundSettings[soundEvent.type];
        return eventSetting ? soundLibrary.getSound(eventSetting.soundName) : null;
    }

    const scheduler = options.scheduler || Rx.Scheduler.timeout;
    let reloading = false;

    const sounds = events.all
        .where((event) => config.notifications.sounds.enabled)
        .where((event) => !reloading)
        .where((event) => !event.details.isDisabled)
        .selectMany(whenDashboardInactive)
        .select((event) => mapEventToSoundEvent(event))
        .where((soundEvent) => soundEvent.type !== soundDefs.SoundEventTypes.Unknown)
        .select((soundEvent) => mapSoundEventToSound(soundEvent))
        .where((sound) => sound !== null);

    events.getByName('servicesInitializing').subscribe(() => {
        reloading = true;
    });
    events.getByName('servicesInitialized').subscribe(() => {
        reloading = false;
    });

    sounds.subscribe((soundInfo) => soundDriver.play(soundInfo.src));
}

export default {
    init
};



