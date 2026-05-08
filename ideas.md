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


## optymalizacja danych na esp


duzy trickrate ale esp zapisuje do pliku z przejscia dane zoptymalizwoane 

jeśli odchylenie standardowe < progu to zapsiujemy jedne pomiar który będzie średnią z danycn pomiarów 
np raz na sekundę 

## timeline

timeline w pionie - od dołu zaczynając i scroll w górę 

po lewej stonie wysokość 

po prawej stronie wydazenia takie jak: odpadnięcie z wraz z siłą udezenia - oraz długość lotu - czas lotu?