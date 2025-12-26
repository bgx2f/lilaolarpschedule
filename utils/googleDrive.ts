
import { LarpData } from '../types';

// Constants
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file'; // Only access files created by this app
const DB_FILE_NAME = 'larp_schedule_db.json';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Initialize GAPI client
export const initGapiClient = async (apiKey: string, clientId: string, updateSigninStatus: (isSignedIn: boolean) => void) => {
  const gapi = (window as any).gapi;
  
  await new Promise<void>((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: DISCOVERY_DOCS,
        });
        gapiInited = true;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
};

// Initialize Google Identity Services
export const initGis = (clientId: string, updateSigninStatus: (isSignedIn: boolean) => void) => {
  const google = (window as any).google;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (resp: any) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      updateSigninStatus(true);
    },
  });
  gisInited = true;
};

// Trigger Login
export const handleAuthClick = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }
};

// Revoke Token (Logout)
export const handleSignoutClick = () => {
  const google = (window as any).google;
  const gapi = (window as any).gapi;
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
  }
};

// 1. Find the DB file
export const findDbFile = async (): Promise<string | null> => {
  const gapi = (window as any).gapi;
  try {
    const response = await gapi.client.drive.files.list({
      q: `name = '${DB_FILE_NAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }
    return null;
  } catch (err) {
    console.error('Error finding file', err);
    throw err;
  }
};

// 2. Read the DB file
export const readDbFile = async (fileId: string): Promise<LarpData> => {
  const gapi = (window as any).gapi;
  try {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    return response.result as LarpData;
  } catch (err) {
    console.error('Error reading file', err);
    throw err;
  }
};

// 3. Create the DB file
export const createDbFile = async (data: LarpData): Promise<string> => {
  const gapi = (window as any).gapi;
  const fileContent = JSON.stringify(data);
  const metadata = {
    name: DB_FILE_NAME,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  try {
    // GAPI client doesn't support multipart upload easily, using fetch with token
    const accessToken = gapi.client.getToken().access_token;
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form,
    });
    const json = await response.json();
    return json.id;
  } catch (err) {
    console.error('Error creating file', err);
    throw err;
  }
};

// 4. Update the DB file
export const updateDbFile = async (fileId: string, data: LarpData): Promise<void> => {
  const gapi = (window as any).gapi;
  const fileContent = JSON.stringify(data);
  const metadata = {
    mimeType: 'application/json',
  };

  try {
     // Using fetch for 'PATCH' with uploadType=media or multipart to update content
    const accessToken = gapi.client.getToken().access_token;
    
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: new Headers({ 
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
      }),
      body: fileContent,
    });
  } catch (err) {
    console.error('Error updating file', err);
    throw err;
  }
};
