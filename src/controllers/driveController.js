const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Đường dẫn đến file apikeys.json (có thể chỉnh nếu bạn đặt file chỗ khác)
const KEY_FILE_PATH = path.join(__dirname, '../config/apikeys.json');

async function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
  });
  return await auth.getClient();
}

async function uploadFileToDrive(localFilePath, fileName, mimeType) {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  // Đọc folderId và sharedDriveId từ file apikeys.json nếu bạn không muốn dùng biến môi trường
  const credentials = JSON.parse(fs.readFileSync(KEY_FILE_PATH, 'utf8'));

  // 👉 Nếu bạn vẫn muốn dùng .env để tách biệt ID folder và shared drive:
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const sharedDriveId = process.env.GOOGLE_SHARED_DRIVE_ID;

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: fs.createReadStream(localFilePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id',
    supportsAllDrives: true,
    driveId: sharedDriveId,
  });

  const fileId = response.data.id;

  // // Cấp quyền public
  // await drive.permissions.create({
  //   fileId,
  //   requestBody: {
  //     role: 'reader',
  //     type: 'anyone',
  //   },
  //   supportsAllDrives: true,
  // });

  const previewLink = `https://drive.google.com/file/d/${fileId}/preview`;
  return { fileId, previewLink };
}

module.exports = {
  uploadFileToDrive,
};
