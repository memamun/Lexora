import fs from 'fs';
import path from 'path';
import os from 'os';

const USERS = [
  {
    uid: "2OsTnCw83mZrmnQShQXZSvixT152",
    email: "testuser@example.com",
    displayName: "Test User",
    provider: "password",
    photoURL: null,
    role: "admin",
    createdAt: "2026-06-02T19:07:21.929Z",
    lastLoginAt: "2026-06-02T19:07:21.929Z"
  },
  {
    uid: "HBfN4PjdqIQwZrxpoN5iCc6T4UA3",
    email: "raisanashita17@gmail.com",
    displayName: "না শি তা",
    provider: "google.com",
    photoURL: "https://lh3.googleusercontent.com/a/ACg8ocICSoiZVrVX127HTw2l3D1mx49CShmwJm3TXRuvbTsylJNjVAPk=s96-c",
    role: "user",
    createdAt: "2026-06-23T14:38:10.949Z",
    lastLoginAt: "2026-06-24T15:35:43.685Z"
  },
  {
    uid: "LenKZxl8fYOC4ZC4Uq1WCb5Krp32",
    email: "mkt1807047brur@gmail.com",
    displayName: "Md. Tutul Hossain",
    provider: "google.com",
    photoURL: "https://lh3.googleusercontent.com/a/ACg8ocIHNtPnFLJ3YgS63t72FU8-O233FxXjpebixZZ4yun0wUClnik=s96-c",
    role: "user",
    createdAt: "2026-06-23T16:38:22.678Z",
    lastLoginAt: "2026-06-23T16:38:22.678Z"
  },
  {
    uid: "MQpMol5h29cJiWUJ3QncKc3owYV2",
    email: "amamun595@yahoo.com",
    displayName: "jogn",
    provider: "password",
    role: "admin",
    photoURL: null,
    createdAt: "2026-06-09T18:43:48.994Z",
    lastLoginAt: "2026-06-09T18:43:48.994Z"
  },
  {
    uid: "Ma9B3zc2D7OetYalkGVovNIiuYu1",
    email: "mdsani-2019518608@osl.du.ac.bd",
    displayName: "MD Sani",
    provider: "password",
    photoURL: null,
    role: "user",
    createdAt: "2026-06-23T14:35:05.557Z",
    lastLoginAt: "2026-06-23T14:35:05.557Z"
  },
  {
    uid: "Qe0cR0RjahaiJ5Pz5NetXMdhafk2",
    email: "flashiamamun@gmail.com",
    displayName: "Mamun",
    provider: "password",
    role: "admin",
    photoURL: null,
    createdAt: "2026-06-08T02:27:33.364Z",
    lastLoginAt: "2026-06-08T02:27:33.364Z"
  },
  {
    uid: "YmwmrNP7uTOxNl1EnpuRGv8mXvw1",
    email: "palmparadise9@gmail.com",
    displayName: "Palm paradise",
    provider: "google.com",
    photoURL: "https://lh3.googleusercontent.com/a/ACg8ocKh-qvs3G5a5QlAuOP2c2lYew3z3HqkvWvOvXXwl7q1tq-9Rw=s96-c",
    role: "user",
    createdAt: "2026-06-09T21:16:14.444Z",
    lastLoginAt: "2026-06-23T13:48:45.494Z"
  },
  {
    uid: "hf3oEx9sJCReIKUacyN05ykE8fE3",
    email: "masudajannatul@gmail.com",
    displayName: "Masuda Jannatul",
    provider: "google.com",
    photoURL: "https://lh3.googleusercontent.com/a/ACg8ocKMslNI7GEMpI9xOw5tqhnxGkuqF77TPLSN5ZQLDE2k8WW3qgWG=s96-c",
    role: "user",
    createdAt: "2026-06-09T22:38:43.236Z",
    lastLoginAt: "2026-06-24T04:35:46.358Z"
  },
  {
    uid: "iGMFtRomALdBzx0bPiAvMCcxEl62",
    email: "mehedihasan446259@gmail.com",
    displayName: "Mehedi Hassan",
    provider: "google.com",
    photoURL: "https://lh3.googleusercontent.com/a/ACg8ocL4lK5oXUxDhSi0yQd94Zy8muncy0AE45cbcdRAOE4kiEUBgg=s96-c",
    role: "user",
    createdAt: "2026-06-25T02:46:11.203Z",
    lastLoginAt: "2026-06-25T02:46:11.204Z"
  },
  {
    uid: "iR333RUX2kYlYqqIfzBvYhyADrF2",
    email: "ashik.ru.ges1314@gmail.com",
    displayName: "Md. Ashikur Rahman",
    provider: "google.com",
    photoURL: "https://lh3.googleusercontent.com/a/ACg8ocKfVFETCT8WhAINgDDGCV9EZKfv4b3gXY7oPm4ypsIlveifWT8=s96-c",
    role: "user",
    createdAt: "2026-06-23T17:47:53.238Z",
    lastLoginAt: "2026-06-23T17:47:53.238Z"
  },
  {
    uid: "rTkSRvsWypbRdviOxCIjvYgJG1x1",
    email: "raju.iu.ais@gmail.com",
    displayName: "Raju Biswas",
    provider: "password",
    photoURL: null,
    role: "user",
    createdAt: "2026-06-23T13:46:36.874Z",
    lastLoginAt: "2026-06-23T13:46:36.874Z"
  },
  {
    uid: "uKsDoLh1ZkZOO3H8ONTGEPXSEnE2",
    email: "mamunabdullah5220@gmail.com",
    displayName: "Md Abdullah Al Mamun",
    provider: "google.com",
    photoURL: "https://lh3.googleusercontent.com/a/ACg8ocJQnBtpWYQqt4UeHtzgJVMlKf7DzWeqvF3oh0O7Ndis4BMKO5UT=s96-c",
    role: "admin",
    createdAt: "2026-06-09T20:51:38.775Z",
    lastLoginAt: "2026-06-09T20:53:31.570Z"
  },
  {
    uid: "zxlBYJaClaQhaqIUF51Y8NDxq3J3",
    email: "a.a.mamun595@gmail.com",
    displayName: "Abdullah Al Mamun",
    provider: "google.com",
    photoURL: "https://lh3.googleusercontent.com/a/ACg8ocJ3C6lVzJ9lhaziKxfCIgMu9XD2W6oqDAHr-J-aQibqcHZI0a9qCQ=s96-c",
    role: "admin",
    createdAt: "2026-06-09T09:29:00.581Z",
    lastLoginAt: "2026-06-09T09:38:52.331Z"
  }
];

const PROJECT_ID = 'lexora-daa30';

async function main() {
  try {
    const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Firebase CLI config not found at ${configPath}. Please run firebase login first.`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    let accessToken = config.tokens?.access_token;
    
    const expiresAt = config.tokens?.expires_at;
    const isExpired = expiresAt ? Date.now() >= expiresAt : true;

    if (isExpired) {
      console.log('Access token expired. Refreshing OAuth2 access token...');
      const refreshToken = config.tokens?.refresh_token;
      if (!refreshToken) {
        throw new Error('Refresh token not found in firebase-tools config.');
      }

      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
          client_secret: 'LswsU-qy5u5sTy4Z57WzTA3i3',
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (!tokenResp.ok) {
        const errText = await tokenResp.text();
        throw new Error(`Failed to refresh token: ${errText}`);
      }

      const tokenData = await tokenResp.json();
      accessToken = tokenData.access_token;
      console.log('Access token refreshed successfully.');
    } else {
      console.log('Using active access token from firebase-tools.json config.');
    }

    for (const user of USERS) {
      console.log(`Syncing user: ${user.email} (${user.uid})...`);
      
      const firestoreDoc = {
        fields: {
          uid: { stringValue: user.uid },
          email: { stringValue: user.email },
          displayName: { stringValue: user.displayName },
          provider: { stringValue: user.provider },
          role: { stringValue: user.role },
          createdAt: { timestampValue: user.createdAt },
          lastLoginAt: { timestampValue: user.lastLoginAt }
        }
      };

      if (user.photoURL) {
        firestoreDoc.fields.photoURL = { stringValue: user.photoURL };
      } else {
        firestoreDoc.fields.photoURL = { nullValue: null };
      }

      // Use PATCH to write only the user details, preserving existing subcollections and fields like levelProgress
      const fieldsToUpdate = ['uid', 'email', 'displayName', 'photoURL', 'provider', 'role', 'createdAt', 'lastLoginAt'];
      const updateMaskParams = fieldsToUpdate.map(f => `updateMask.fieldPaths=${f}`).join('&');
      
      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${user.uid}?${updateMaskParams}`;

      const writeResp = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(firestoreDoc)
      });

      if (!writeResp.ok) {
        const errText = await writeResp.text();
        console.error(`Failed to sync user ${user.email}: ${errText}`);
      } else {
        console.log(`Successfully synced user ${user.email}.`);
      }
    }

    console.log('Sync complete.');
  } catch (err) {
    console.error('Error running sync script:', err);
    process.exit(1);
  }
}

main();
