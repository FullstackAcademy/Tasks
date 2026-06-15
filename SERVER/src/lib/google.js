const { google } = require("googleapis");
const prisma = require("../prisma");

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function getCalendarForUser(userId) {
  const account = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!account) {
    return null;
  }
  const auth = createOAuthClient();
  auth.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiryDate ? account.expiryDate.getTime() : undefined,
  });
  auth.on("tokens", async (tokens) => {
    await prisma.googleAccount.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token ?? account.accessToken,
        expiryDate: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : account.expiryDate,
      },
    });
  });
  return google.calendar({ version: "v3", auth });
}

module.exports = { createOAuthClient, getCalendarForUser };