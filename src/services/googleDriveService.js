const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

async function uploadVideoToDrive(filePath, fileName) {
  const folderId = '1YYE2e2iPTZVg96q5b2mzy8cUF-z9Urfr'; // folder trong Shared Drive
  const sharedDriveId = '0AN8oOQvbzcoIUk9PVA'; // ID của Bộ nhớ dùng chung

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'video/mp4',
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id',
    supportsAllDrives: true,
    driveId: sharedDriveId, // ✅ Bổ sung dòng này
  });

  const fileId = response.data.id;

  // await drive.permissions.create({
  //   fileId,
  //   requestBody: {
  //     role: 'reader',
  //     type: 'anyone',
  //   },
  //   supportsAllDrives: true,
  // });

  const viewLink = `https://drive.google.com/file/d/${fileId}/preview`;
  return viewLink;
}

module.exports = { uploadVideoToDrive };
