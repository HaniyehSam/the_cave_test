// Every hand-made zone in the world. Each one owns a single 960×960 section.
//
//            col -2      col -1        col 0          col 1            col 2      col 3
//   row -1               Observatory   Rooftops       Cloud Orchard
//   row 0    Cabinet     Greenhouse    Paper Street   Night Market     Harbour    Station
//   row 1                Root Cellar   Library        Drowned Garden
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

export const ZONES = [observatory, rooftops, orchard, cabinet, greenhouse, home, market, harbour, station, cellar, library, seafloor];
