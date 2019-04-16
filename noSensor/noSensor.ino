#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

const int pinCE = 7;
const int pinCSN = 8;
RF24 radio(pinCE, pinCSN);
#define WHICH_NODE 1
const uint64_t wAddress[] = {0x7878787878LL, 0xB3B4B5B6F1LL, 0xB3B4B5B6CDLL,
                             0xB3B4B5B6A3LL, 0xB3B4B5B60FLL, 0xB3B4B5B605LL
                            };
const uint64_t PTXpipe = wAddress[ WHICH_NODE - 1 ];
char dataToSend[23] = "-26.915125, -48.658183";
byte counter = 1;
bool done = false;

void setup() {
  Serial.begin(115200);
  radio.begin();
  radio.setPALevel(RF24_PA_MIN);
  radio.setDataRate( RF24_2MBPS );
  radio.setChannel(108);
  radio.openReadingPipe(0, PTXpipe);
  radio.stopListening();
}

void loop() {
  if (!done) {
    radio.openWritingPipe(PTXpipe);
    if (!radio.write(&dataToSend, sizeof(dataToSend))) {
      Serial.println(F("Falha no envio de dados..."));
    } else {
      Serial.print(F("Enviado: "));
      Serial.println(dataToSend);
      radio.startListening();
      unsigned long startTimer = millis(); //start timer
      bool timeout = false;
      while (!radio.available() && !timeout) {
        if (millis() - startTimer > 200) {
          timeout = true;
        }
      }
      if (timeout) {
        Serial.println(F("Acknowledgement não recebido..."));
      } else {
        char ack;
        radio.read(&ack, sizeof(ack));
        if (ack == '1') {
          Serial.print(F("Acknowledgement recebido: "));
          Serial.println(ack);
          done = true;
        } else {
          Serial.println(F("Acknowledgement não recebido..."));
          done = false;
        }
      }
      radio.stopListening();
    }
  } else {
    done = false;
    Serial.println("Aguarda 15 segundos para o próximo envio");
    delay(15000);
  }
}
