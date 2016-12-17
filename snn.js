let info = console.log

const memb = [];
const numneuron = 8;
const sconnection = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];
const nconnection = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];
const minimum = 0;
const leaking = 1;
let threshold = 1;
let neuron = 0;
let signs = 0;

let sensor = 0;
let sensorflag = 0;
let sensorread = 0;
let sensormaxactivity = 0;

let spikeFL = 0;
let spikeBL = 0;
let spikeFR = 0;
let spikeBR = 0;
let totalspikeFL = 0;
let totalspikeBL = 0;
let totalspikeFR = 0;
let totalspikeBR = 0;
let maxspikes = 0;

let evolveflag = 0;

let collision = 0;

let dirL = 0;
let dirR = 0;
let v2 = 0;
let v3 = 0;

let newfitness = 0;

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function seedMembrane() {
  memb[0] = threshold + 20;
  memb[2] = threshold + 20;
  // Debugging
  //memb[4] = threshold + 20;
  //memb[5] = threshold + 20;
  //memb[6] = threshold + 20;
  //memb[7] = threshold + 20;
}

function iterate() {
  // Sensor/Motor Updating
  if (sensorflag == 0) {
    sensor = 0; // If sensors aren't ready, sensor nodes shouldn't be spiking
  } else {
    sensor = sensorread;
    sensorflag = 0;
    spikeFL = 0;
    spikeBL = 0;
    spikeFR = 0;
    spikeBR = 0;
    maxspikes = 0;
  }

  if (evolveflag == 1) { // If just evolved
    // Spike Forward Motor Neurons to start
    seedMembrane();

    evolveflag = 0;

    totalspikeFL = 0;
    totalspikeBL = 0;
    totalspikeFR = 0;
    totalspikeBR = 0;
  }

  // Debugging
  //printf("%lx\n\r", neuron);
  //////////////Refractory Period/Contribution of Incoming Spikes/Membrane Potential Update//////////////
  for (let i = 0; i < numneuron; i++) {
    // Refractory Period Check (if spike generated in previous update, don't update membrane potential)
    if (((neuron >> i) & 0x01) == 0) {
      // Calculate Contribution of Sensors and update membrane potential
      memb[i] = (memb[i] +
        (((sensor & sconnection[i]) & 0b10000000) >> 7) +
        (((sensor & sconnection[i]) & 0b01000000) >> 6) +
        (((sensor & sconnection[i]) & 0b00100000) >> 5) +
        (((sensor & sconnection[i]) & 0b00010000) >> 4) +
        (((sensor & sconnection[i]) & 0b00001000) >> 3) +
        (((sensor & sconnection[i]) & 0b00000100) >> 2) +
        (((sensor & sconnection[i]) & 0b00000010) >> 1) +
        (((sensor & sconnection[i]) & 0b00000001) >> 0));

      // Calculate Contribution of Positive Neurons and update membrane potential
      memb[i] = (memb[i] +
        (((neuron & signs & nconnection[i]) & 0b10000000) >> 7) +
        (((neuron & signs & nconnection[i]) & 0b01000000) >> 6) +
        (((neuron & signs & nconnection[i]) & 0b00100000) >> 5) +
        (((neuron & signs & nconnection[i]) & 0b00010000) >> 4) +
        (((neuron & signs & nconnection[i]) & 0b00001000) >> 3) +
        (((neuron & signs & nconnection[i]) & 0b00000100) >> 2) +
        (((neuron & signs & nconnection[i]) & 0b00000010) >> 1) +
        (((neuron & signs & nconnection[i]) & 0b00000001) >> 0));

      // Calculate Contribution of Negative Neurons and update membrane potential
      memb[i] = (memb[i] -
        (((neuron & ((~signs) & 0xFF) & nconnection[i]) & 0b10000000) >> 7) -
        (((neuron & ((~signs) & 0xFF) & nconnection[i]) & 0b01000000) >> 6) -
        (((neuron & ((~signs) & 0xFF) & nconnection[i]) & 0b00100000) >> 5) -
        (((neuron & ((~signs) & 0xFF) & nconnection[i]) & 0b00010000) >> 4) -
        (((neuron & ((~signs) & 0xFF) & nconnection[i]) & 0b00001000) >> 3) -
        (((neuron & ((~signs) & 0xFF) & nconnection[i]) & 0b00000100) >> 2) -
        (((neuron & ((~signs) & 0xFF) & nconnection[i]) & 0b00000010) >> 1) -
        (((neuron & ((~signs) & 0xFF) & nconnection[i]) & 0b00000001) >> 0));

      // Minumimum of memb is 0
      if (memb[i] < minimum) {
        memb[i] = minimum;
      }
    }
  }

  ///////////////////////////////////////////Spike Generation////////////////////////////////////////////
  for (let j = 0; j < numneuron; j++) {
    let randomint = getRandomInt(-2, 2);
    if (memb[j] >= (threshold + randomint)) {
      neuron = (neuron | (1 << j));
      memb[j] = minimum;
    } else {
      neuron = (neuron & (~(1 << j)));
    }
  }

  //////////////////////////////////////////Motor Spike//////////////////////////////////////////////////
  // 1st neuron is left forward motor, 2nd is left backward motor, 3rd if right forward motor, 4th is right backward motor
  // If spiking add to total number of spikes
  if ((neuron & 0x01) == 1) {
    spikeFL++;
    totalspikeFL++;
  }
  if ((neuron & 0x02) == 2) {
    spikeBL++;
    totalspikeBL++;
  }
  if ((neuron & 0x04) == 4) {
    spikeFR++;
    totalspikeFR++;
  }
  if ((neuron & 0x08) == 8) {
    spikeBR++;
    totalspikeBR++;
  }

  maxspikes++;

  ///////////////////////////////////////////Leakage/////////////////////////////////////////////////////
  for (let k = 0; k < numneuron; k++) {
    if ((memb[k] - leaking) >= minimum) {
      memb[k] = memb[k] - leaking;
    } else {
      memb[k] = minimum;
    }
  }
}

///////////////////////////////////////Motor Speed Update//////////////////////////////////////////////
// Motor speed for next 20ms is for each motor: spikesforward-spikesbackward scaled to [-8 cm/s, 8 cm/s]
// Velocity will be determined by time of each step which is equal to .332485 cm / (spikesforward-spikesbackward)
// Ie. this is initialized to .332485 cm / 3.32483 cm / s = .1 s = 100 ms
// Concern here is that time will always be significantly higher than next motor udpate time, risk?
function updateMotors() {
  //printf("%li %li %li %li %ld\n\r", spikeFL, spikeBL, spikeFR, spikeBR, maxspikes);
  if (spikeFL >= spikeBL) // If more forward then back, direction is forward
  {
    // Debugging
    dirL = 0;
    // Multiply by 8.0 since maxspikes is actually maxspikes * 2 since if a neuron does spike it won't spike twice in a row because of the refractory period
    v2 = (((spikeFL - spikeBL) / maxspikes) * 2.0 * 8.0);
    // Debugging (comment out t2 change)
    // t2 = (0.332485 / v2 * 1000.0);
    // time2 = t2;
  } else {
    // Debugging
    dirL = 1;
    v2 = (((spikeBL - spikeFL) / maxspikes) * 2.0 * 8.0);
    // Debugging
    // t2 = (0.332485 / v2 * 1000.0);
    // time2 = t2;
  }
  if (spikeFR >= spikeBR) // If more forward then back, direction is forward
  {
    // Debugging
    dirR = 0;
    v3 = (((spikeFR - spikeBR) / maxspikes) * 2.0 * 8.0);
    // Debugging
    // t3 = (0.332485 / v3 * 1000.0);
    // time3 = t3;
  } else {
    // Debugging
    dirR = 1;
    v3 = (((spikeBR - spikeFR) / maxspikes) * 2.0 * 8.0);
    // Debugging
    // t3 = (0.332485 / v3 * 1000.0);
    // time3 = t3;
  } // } Motor Speed update

  // Set tsk4cnt to be the greater of the times 350>tsk4cnt>60
  // if (t2 > t3 && t2 <= 350) {
  //   tsk4cnt = t2 + 10;
  // } else if (t3 > t2 && t3 <= 350) {
  //   tsk4cnt = t3 + 10;
  // } else tsk4cnt = 60;
  //printf("%li %li\n\r", t2, t3);
}

function updateFitness() {
  // Fitness Calculation
  if (dirL == 0 && dirR == 0 && collision == 0) // As long as going forward on both wheels and no collision
  {
    if (v2 >= v3) {
      newfitness = newfitness + (v2 + v3) * (1.0 - ((v2 - v3) / 8.0)) * (1.0 - (sensormaxactivity)); // Need to add something to sensor
      //change = (v2+v3)*(1.0-((v2-v3)/8.0))*(1.0-(sensormaxactivity));
      //printf("%5.2f", change);
    } else {
      newfitness = newfitness + (v2 + v3) * (1.0 - ((v3 - v2) / 8.0)) * (1.0 - (sensormaxactivity)); // Need to add something to sensor
      //change = (v2+v3)*(1.0-((v3-v2)/8.0))*(1.0-(sensormaxactivity));
      //printf("%5.2f", change);
    }
  } else if ((dirL == 1 || dirR == 1) && collision == 0) {
    newfitness = newfitness + 0;
    //printf("YES\n\r");
  } else if (collision == 1) {
    newfitness = newfitness + 0;
    //printf("NO\n\r");
  }
}

function updateSensors() {
  sensorread = getRandomInt(0, 255)

  // sensormaxactivity = sensoractivity[0];
  // for (g = 1; g < (numsensor / 3); g++) {
  //   if (sensoractivity[g] > sensormaxactivity) {
  //     sensormaxactivity = sensoractivity[g];
  //   }
  // }

  // collision = 1;
}

function to8Bits(x) {
  var a = [0, 0, 0, 0, 0, 0, 0, 0]
  for (let i = 0; i < 8; i++) {
    a[7 - i] = (x >> i) & 1;
  }
  return a.join("")
}

evolveflag = 1;

for (let i = 0; i < 8; i++) {
  nconnection[i] = getRandomInt(0, 255);
}

for (let i = 0; i < 100; i++) {
  sensorflag = i % 10;
  if (sensorflag) {
    updateSensors();
  }

  iterate();
  updateMotors();
  updateFitness();

  info(to8Bits(neuron), "L", spikeFL, spikeBL, dirL, "R", spikeFR, spikeBR, dirR);
}
