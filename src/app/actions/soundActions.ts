export const SOUND_LOAD = 'sound-load';
export const SOUND_PLAY = 'sound-play';
export const SOUND_STOP = 'sound-stop';

export function loadSound(message: any)
{
	return { type: SOUND_LOAD, message };
}

export function playSound(message: any)
{
	return { type: SOUND_PLAY, message };
}

export function stopSound(message: any)
{
	return { type: SOUND_STOP, message };
}