#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

//===========================ESP8266================================
WiFiClientSecure espClient;
PubSubClient client(espClient);
const char* mqtt_server = "{Públic DNS}"; //echo | openssl s_client -connect {PUBLIC_DNS}:{PORT} | openssl x509 -fingerprint -noout
const char* cfg_wifi_ssid = "{SSID}";
const char* cfg_wifi_password = "{PASSWORD}";
const unsigned int mqtt_port = 8883;
const char* mqtt_user = "{Mqtt User Bengala}";
const char* mqtt_pass = "{Mqtt User Password}";
const char* mqtt_fprint = "{Ex:E6:02:1F:94:A7:66:FA:51:CB:53:6B:18:1A:4F:D4:E3:68:F4:67:76}";
const int BUZZER_PIN = 5;

//===========================NRF24L01+=============================
const int pinCE = 4;
const int pinCSN = 15;
RF24 radio(pinCE, pinCSN);
const uint64_t rAddress[] = {0x7878787878LL, 0xB3B4B5B6F1LL, 0xB3B4B5B6CDLL,
                             0xB3B4B5B6A3LL, 0xB3B4B5B60FLL, 0xB3B4B5B605LL
                            };
char dataReceived[23];
char ack = '1';
const char* MAC_char = "{MAC ADDRESS}";
//==================================================================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.println("Mensagem da aplicação web recebida!");
  Serial.print("Tópico: ");
  Serial.println(topic);
  char message[length + 1];
  for (int i = 0; i < length; i++) {
    message[i] = (char)payload[i];
  }
  message[length] = '\0';

  f(strcmp(message, "hellobengala") == 0) {
    Serial.print("Mensagem: ");
    Serial.println(message);
    Serial.print("Acionando o buzzer por 200ms...");
    tone(BUZZER_PIN, 1000);
    delay(200);
    noTone(BUZZER_PIN);
  } else {
    Serial.println("Mensagem Incorreta, o sinal não será emitido");
  }
}
//==================================================================
void verifyFingerprint() {
  if (client.connected() || espClient.connected()) return;
  Serial.println("Verificando TLS @ ");
  Serial.println(mqtt_server);
  Serial.println("...");
  if (!espClient.connect(mqtt_server, mqtt_port)) {
    Serial.println("Connection failed. Rebooting.");
    Serial.flush();
    ESP.restart();
  }
  if (espClient.verify(mqtt_fprint, mqtt_server)) {
    Serial.println("Conexão segura -> .");
  } else {
    Serial.println("Conexão insegura! Reiniciando.");
    Serial.flush();
    ESP.restart();
  }
  espClient.stop();
  delay(100);
}
//==================================================================
void setupWifi() {
  Serial.println("Testa MQTT");
  WiFi.mode(WIFI_STA);
  WiFi.begin(cfg_wifi_ssid, cfg_wifi_password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");

  }
  Serial.println("");
  Serial.println("WiFi conectado");
  Serial.println("Endereço IP: ");
  Serial.println(WiFi.localIP());
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  while (!client.connected()) {
    Serial.print("Tentando realizar conexão MQTT...");
    verifyFingerprint();
    if (client.connect(WiFi.macAddress().c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("Estabelecida.");
      tone(BUZZER_PIN, 1000);
      delay(200);
      noTone(BUZZER_PIN);
      client.subscribe("/bengala/set/{MAC ADDRESS}");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.print(" tentando novamente em 5 segundos");
      delay(5000);
    }
  }
}
//==================================================================
void setup() {
  Serial.begin(115200);
  setupWifi();
  Serial.println("Rx Iniciando...");
  radio.begin();
  radio.setPALevel(RF24_PA_MIN);
  radio.setDataRate( RF24_2MBPS );
  radio.setChannel(108);
  radio.openReadingPipe(0, rAddress[0]);
  radio.openReadingPipe(1, rAddress[1]);
  radio.openReadingPipe(2, rAddress[2]);
  radio.openReadingPipe(3, rAddress[3]);
  radio.openReadingPipe(4, rAddress[4]);
  radio.openReadingPipe(5, rAddress[5]);
  radio.startListening();
}
//==================================================================
void loop() {
  client.loop();
  if (radio.available()) {
    receiveData();
  }
  delay(200);
}
//==================================================================
void receiveData() {
  byte pipeNum = 0;
  while (radio.available(&pipeNum)) {
    radio.read(&dataReceived, sizeof(dataReceived));
    Serial.print(F("Dado enviado pelo transmissor: "));
    Serial.println(pipeNum + 1);
    Serial.print(F("Dado: "));
    Serial.println(dataReceived);
    if (sizeof(dataReceived) != 23) {
      Serial.println(F("Falha no recebimento do pacote..."));
    } else {
      if (sendAck(pipeNum)) {
        Serial.println(F("Acknowledgement enviado com sucesso!"));
        char topico[36];
        strcpy(topico, "/bengala/location/");
        strcat(topico, MAC_char);
        client.publish(topico, dataReceived);
        tone(BUZZER_PIN, 1000);
        delay(200);
        noTone(BUZZER_PIN);
        Serial.println("Mensagem publicada ao broker com sucesso.");
      } else {
        Serial.println(F("Falha no envio do acknowledgement"));
        radio.startListening();
      }
      Serial.println();
    }
  }
}
//==================================================================
bool sendAck (byte ackPipeNumber) {
  bool ackFlag;
  radio.stopListening();
  radio.openWritingPipe(rAddress[ackPipeNumber]);
  if (!radio.write(&ack, sizeof(char))) {
    ackFlag = false;
  } else {
    ackFlag = true;
    ackPipeNumber = ackPipeNumber + 1;
    char topic[9];
    sprintf(topic, "nosensor%0u", ackPipeNumber);
  }
  radio.startListening();
  return ackFlag;
}
