const twilio = require('twilio');

const accountSid = process.env.ACCOUNT_SID;
const authToken =  process.env.AUTH_TOKEN;

const client = twilio(accountSid, authToken);

// Generate TURN credentials
async function getTurnCredentials() {
  try {
    const token = await client.tokens.create({
      ttl: 3600 // 1 hour expiry
    });
    
    // console.log('TURN Server Configuration:');
    // console.log(JSON.stringify(token.iceServers, null, 2));
    
    // console.log(token.iceServers);
    return token.iceServers;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

module.exports = getTurnCredentials;