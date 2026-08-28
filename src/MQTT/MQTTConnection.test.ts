import { mock } from 'jest-mock-extended';
import { MqttClient } from 'mqtt';
import { MQTTConnection } from './MQTTConnection';

describe(MQTTConnection.name, () => {
  const buildSubject = () => {
    const client = mock<MqttClient>();
    return { client, connection: new MQTTConnection(client) };
  };

  describe('publish', () => {
    it('stringifies numbers', () => {
      const { client, connection } = buildSubject();
      connection.publish('topic', 61.7);
      expect(client.publish).toHaveBeenCalledWith('topic', '61.7', { qos: 1 });
    });

    it('stringifies booleans', () => {
      const { client, connection } = buildSubject();
      connection.publish('topic', true);
      expect(client.publish).toHaveBeenCalledWith('topic', 'true', { qos: 1 });
    });

    it('JSON-stringifies objects', () => {
      const { client, connection } = buildSubject();
      connection.publish('topic', { a: 1 });
      expect(client.publish).toHaveBeenCalledWith('topic', '{"a":1}', { qos: 1 });
    });

    it('passes strings through unchanged', () => {
      const { client, connection } = buildSubject();
      connection.publish('topic', 'already-a-string');
      expect(client.publish).toHaveBeenCalledWith('topic', 'already-a-string', { qos: 1 });
    });
  });
});
