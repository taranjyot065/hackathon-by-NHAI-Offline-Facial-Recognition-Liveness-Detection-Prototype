import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet
} from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  { name: 'attendance.db', location: 'default' },
  () => console.log('DB Opened'),
  error => console.log(error)
);

export default function App() {

  const [challenge, setChallenge] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {

    createTable();

    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected;
      setIsConnected(connected);

      if (connected) {
        syncData();
      }
    });

    generateChallenge();

    return unsubscribe;

  }, []);

  const createTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employeeId TEXT,
          timestamp TEXT,
          synced INTEGER
        )`
      );
    });
  };

  const generateChallenge = () => {

    const challenges = [
      'Blink',
      'Smile',
      'Turn Head Left',
      'Turn Head Right'
    ];

    const random =
      challenges[Math.floor(Math.random() * challenges.length)];

    setChallenge(random);
  };

  const simulateLiveness = () => {

    Alert.alert(
      'Liveness Passed',
      `Challenge Completed: ${challenge}`
    );

    markAttendance();
  };

  const markAttendance = () => {

    const employeeId = 'EMP101';

    const timestamp =
      new Date().toISOString();

    db.transaction(tx => {

      tx.executeSql(
        `INSERT INTO attendance
        (employeeId, timestamp, synced)
        VALUES (?, ?, 0)`,
        [employeeId, timestamp],
        () => {
          Alert.alert('Attendance Saved Offline');
        }
      );

    });
  };

  const syncData = () => {

    db.transaction(tx => {

      tx.executeSql(
        `SELECT * FROM attendance WHERE synced = 0`,
        [],
        async (_, result) => {

          const rows = result.rows.raw();

          if (rows.length === 0)
            return;

          try {

            console.log('Uploading...', rows);

            /*
             AWS API CALL HERE

             await fetch(...)
            */

            rows.forEach(record => {

              tx.executeSql(
                `UPDATE attendance
                 SET synced = 1
                 WHERE id = ?`,
                [record.id]
              );

            });

            purgeSynced();

          } catch (err) {
            console.log(err);
          }
        }
      );

    });
  };

  const purgeSynced = () => {

    db.transaction(tx => {

      tx.executeSql(
        `DELETE FROM attendance
         WHERE synced = 1`,
        [],
        () => {
          console.log('Purged Synced Records');
        }
      );

    });
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Offline Face Attendance
      </Text>

      <Text style={styles.challenge}>
        Challenge:
      </Text>

      <Text style={styles.challengeText}>
        {challenge}
      </Text>

      <Button
        title="Simulate Face Verification"
        onPress={simulateLiveness}
      />

      <View style={{ height: 20 }} />

      <Text>
        Internet:
        {isConnected
          ? ' Connected'
          : ' Offline'}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },

  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20
  },

  challenge: {
    fontSize: 18,
    textAlign: 'center'
  },

  challengeText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30
  }
});