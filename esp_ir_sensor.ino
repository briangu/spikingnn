/*
 * Brian Guarraci
 * 
 * Simple obstacle avoidance robot using Pololu romi, esp-8266 wemos D1 and a single IR sensor.
 * 
 */
unsigned char sensorVal = 0;

#define RIGHT_MOTOR_DIR 2
#define RIGHT_MOTOR_PWM 0
#define LEFT_MOTOR_DIR 4
#define LEFT_MOTOR_PWM 5
#define IR_SENSOR 16 // d1 mini

#define DIR_LEVEL_FORWARD LOW
#define DIR_LEVEL_BACKWARD HIGH

#define FORWARD_SENSOR 0x1
#define LEFT_SENSOR 0x2
#define RIGHT_SENSOR 0x4

#define SENSOR_ACTIVE(mask) (sensorVal & mask == mask)

#define FULL_SPEED (0x400 - 1)
#define HALF_SPEED (FULL_SPEED / 2)
#define QUARTER_SPEED (HALF_SPEED / 2)
#define SPEED_PCT(x) (FULL_SPEED * x)

#define QUARTER_SPEED_TURN_DELAY 500
#define FORWARD_DELAY 100
#define RETREAT_DELAY 500
#define STOP_DELAY 100

#define DEFAULT_CONFIDENCE 1.0f
#define MAX_CONFIDENCE 3.0f
#define CONFIDENCE_INCREMENT 0.1f
#define CONFIDENCE_INTERVAL ((1000 / FORWARD_DELAY) / 2)

float confidence = DEFAULT_CONFIDENCE;
unsigned int confidence_counter = 0;

void setup() {
  Serial.begin(9600);
  Serial.println("HELLO!");

  pinMode(IR_SENSOR, INPUT_PULLUP);
  pinMode(RIGHT_MOTOR_DIR, OUTPUT);
  pinMode(LEFT_MOTOR_DIR, OUTPUT);
}

void controlMotors(unsigned int leftDir, unsigned int leftSpeed, unsigned int rightDir, unsigned int rightSpeed, unsigned int ms) {
  digitalWrite(LEFT_MOTOR_DIR, leftDir);
  analogWrite(LEFT_MOTOR_PWM, leftSpeed);
  digitalWrite(RIGHT_MOTOR_DIR, rightDir);
  analogWrite(RIGHT_MOTOR_PWM, rightSpeed * 1.02f);
  delay(ms);
}

void turnLeft(unsigned int speed, unsigned int ms) {
  Serial.println("Turn left");
  controlMotors(DIR_LEVEL_BACKWARD, speed, DIR_LEVEL_FORWARD, speed, ms);
}

void turnRight(unsigned int speed, unsigned int ms) {
  Serial.println("Turn Right");
  controlMotors(DIR_LEVEL_FORWARD, speed, DIR_LEVEL_BACKWARD, speed, ms);
}

void goForward(unsigned int speed, unsigned int ms) {
  Serial.println("Forward");
  controlMotors(DIR_LEVEL_FORWARD, speed, DIR_LEVEL_FORWARD, speed, ms);
}

void goBackward(unsigned int speed, unsigned int ms) {
  Serial.println("Backward");
  controlMotors(DIR_LEVEL_BACKWARD, speed, DIR_LEVEL_BACKWARD, speed, ms);
}

void stop(unsigned int ms) {
  Serial.println("Stop");
  controlMotors(DIR_LEVEL_FORWARD, 0x00, DIR_LEVEL_FORWARD, 0x00, ms);
}

//void lookLeft() {
//  Serial.println("Look left");
//  turnLeft(QUARTER_SPEED, QUARTER_SPEED_TURN_DELAY);
//}
//
//void lookRight() {
//  Serial.println("Look right");
//  turnRight(QUARTER_SPEED, QUARTER_SPEED_TURN_DELAY);
//}
//
//void readForwardDirSensor() {
//  Serial.println("read forward sensor");
//  if (!digitalRead(IR_SENSOR)) {
//    sensorVal |= FORWARD_SENSOR;
//  } else {
//    sensorVal &= ~FORWARD_SENSOR;
//  }
//}
//
//void readLeftDirSensor() {
//  Serial.println("read left sensor");
//  lookLeft();
//  if (!digitalRead(IR_SENSOR)) {
//    sensorVal |= LEFT_SENSOR;
//  } else {
//    sensorVal &= ~LEFT_SENSOR;
//  }
//  lookRight(); // return to center
//}
//
//void readRightDirSensor() {
//  Serial.println("read right sensor");
//  lookRight();
//  if (!digitalRead(IR_SENSOR)) {
//    sensorVal |= RIGHT_SENSOR;
//  } else {
//    sensorVal &= ~RIGHT_SENSOR;
//  }
//  lookLeft();
//}
//
//void scan() {
//  Serial.println("scan: start");
//  readLeftDirSensor();
//  readRightDirSensor();
//  Serial.println("scan: stop");
//}

bool obstacleDetected() {
  return !digitalRead(IR_SENSOR);
}

void loop() {
  if (obstacleDetected()) {
    Serial.println("hit");
    confidence = DEFAULT_CONFIDENCE;
    confidence_counter = 0;
    
    stop(STOP_DELAY);
    goBackward(QUARTER_SPEED, STOP_DELAY);

    turnLeft(QUARTER_SPEED, QUARTER_SPEED_TURN_DELAY);
    if (obstacleDetected()) {
      turnRight(QUARTER_SPEED, QUARTER_SPEED_TURN_DELAY); // recenter
      turnRight(QUARTER_SPEED, QUARTER_SPEED_TURN_DELAY);
      if (obstacleDetected()) {
        turnLeft(QUARTER_SPEED, QUARTER_SPEED_TURN_DELAY);
        goBackward(QUARTER_SPEED, RETREAT_DELAY);
        turnLeft(QUARTER_SPEED, QUARTER_SPEED_TURN_DELAY);
      }
    }
  } else {
    Serial.println("free");
    goForward(QUARTER_SPEED * confidence, FORWARD_DELAY);
    confidence_counter++;
    if ((confidence_counter % CONFIDENCE_INTERVAL) == 0) {
      confidence += CONFIDENCE_INCREMENT;
      if (confidence > MAX_CONFIDENCE) {
        confidence = MAX_CONFIDENCE;
      }
    }
  }
}

