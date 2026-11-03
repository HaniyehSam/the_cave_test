// Every hand-made zone in Little Margin. Each one owns a single 960×960 section. They sit
// apart from each other; the sections in between are empty street, tunnel or sky (empty.js).
//
//          col -5    -4  -3           -2          -1  0              1             2  3                4  5  6
//   row -2                                                                          Cloud Orchard
//   row -1               Observatory                  Rooftops
//   row 0  Cabinet       ·            Greenhouse  ·   Paper Street   Night Market  ·  Harbour          ·  ·  Station
//   row 1                             Root Cellar ·   Library        Painted Cave  ·  Drowned Garden
import cabinet from './cabinet.js';
import cellar from './cellar.js';
import greenhouse from './greenhouse.js';
import harbour from './harbour.js';
import home from './home-street.js';
import library from './library.js';
import market from './night-market.js';
import observatory from './observatory.js';
import orchard from './orchard.js';
import rooftops from './rooftops.js';
import seafloor from './sea-floor.js';
import station from './station.js';
import storycave from './story-cave.js';

export const ZONES = [orchard, observatory, rooftops, cabinet, greenhouse, home, market, harbour, station, cellar, library, storycave, seafloor];
