## get list of activities of frends and yours like in home page in strava.

## data

who: user id, name surname
when: date
what: type of activity [(sport climb || trad climb) && (single-pitch || multi-pitch)]
title: customable - deaflut is type of activity
description: customable - deaflut none
dificulty: climbing grade in choosen by user scale
scale: type of scale [francuska, UIAA, Kurtyki, Brytyjska, Przymiotnikowa, YDS]
If multi-pitch - number of pitches - list of pitches witch dificulties and posilibity to add notes (short description) to each pitch
images of the route - {expo-file-system} (maybe add images of bolts, anchor with some admotations so it wll display in app in the ara of this exact route.
Maybe read metadata and automaticly connect moment of the climb with photo?)
number of falls: number how many falls ocurred douring each pitch
array of fals: the falls with timestamp and the moment of pich and the number of pich
start height: start height witch metests above sea level - maybe aray of pitches with those two for each?
end height: start height witch metests above sea level
the array of quantiroins fowm IMU andcoresponging height from barometer for each pitch to "draw" the route
