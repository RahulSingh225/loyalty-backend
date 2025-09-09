import axios from "axios";

class SmsService {

    async  sendOtp(mobileNumber: string, otp: string, name: string): Promise<any> {
  try {
    const response = await axios.post(
      process.env.MSG91_URL || "https://api.msg91.com/api/v5/otp", // replace with your real MSG91 API URL
      {
        template_id: "68b048d472d54306530c5f84",
        short_url: "0",
        recipients: [
          {
            mobiles: `91${mobileNumber}`,
            var1: otp,
            var2: process.env.PROGRAM_NAME || "Ranjit",
          }
        ]
      },
      {
        headers: {
          accept: "application/json",
          authkey: process.env.MSG91_AUTH_KEY,   // replace with your real MSG91 authkey
          "content-type": "application/json"
        }
      }
    );

    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Error:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    throw error;
  }
}
}

export const smsService = new SmsService();