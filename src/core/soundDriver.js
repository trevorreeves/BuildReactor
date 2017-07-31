import howler from 'howler'

function play(mediaSrc) 
{ 
    var sound = new howler.Howl({ 
        src: [mediaSrc] 
    }); 

    sound.play();
} 
    
export default { 
    play     
}; 