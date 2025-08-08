
const APP_NAME = "AquaHost";
const COMPANY_ADDRESS = "123 Aqua Way, Ocean City, OC 12345";
const SUPPORT_EMAIL = "support@aquahost.com";

const getHeader = () => `
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <h1 style="margin: 0; font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; color: #00008B;">${APP_NAME}</h1>
      </td>
    </tr>
  </table>
`;

const getFooter = () => `
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #E5E7EB; margin-top: 30px; padding-top: 20px;">
    <tr>
      <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: #6B7280;">
        <p style="margin: 0 0 5px 0;">If you have any questions, please contact our support team at <a href="mailto:${SUPPORT_EMAIL}" style="color: #00008B; text-decoration: none;">${SUPPORT_EMAIL}</a>.</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        <p style="margin: 5px 0 0 0;">${COMPANY_ADDRESS}</p>
      </td>
    </tr>
  </table>
`;


const getVerificationEmail = (code: string) => {
    const subject = `Your ${APP_NAME} Verification Code`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; background-color: #FFFFFF;">
        ${getHeader()}
        <h2 style="font-size: 22px; color: #111827; margin-top: 0;">Confirm Your Account</h2>
        <p>Thanks for signing up for ${APP_NAME}! Please use the following code to complete your registration. This code will expire in 10 minutes.</p>
        <div style="background-color: #F3F4F6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #00008B; letter-spacing: 5px; margin: 0;">${code}</p>
        </div>
        <p>If you did not request this, you can safely ignore this email.</p>
        ${getFooter()}
      </div>
    `;
    const text = `Your ${APP_NAME} verification code is: ${code}. It will expire in 10 minutes.`;

    return { subject, html, text };
};


const getLoginEmail = (code: string) => {
    const subject = `Your ${APP_NAME} Login Code`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; background-color: #FFFFFF;">
        ${getHeader()}
        <h2 style="font-size: 22px; color: #111827; margin-top: 0;">Confirm Your Login</h2>
        <p>A login attempt requires a second factor of authentication. Please use the following code to complete your login. This code will expire in 10 minutes.</p>
        <div style="background-color: #F3F4F6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #00008B; letter-spacing: 5px; margin: 0;">${code}</p>
        </div>
        <p>If you did not attempt to log in, please change your password immediately.</p>
        ${getFooter()}
      </div>
    `;
    const text = `Your ${APP_NAME} login code is: ${code}. It will expire in 10 minutes.`;

    return { subject, html, text };
};

const getPasswordResetOtpEmail = (code: string) => {
    const subject = `Your ${APP_NAME} Password Reset Code`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; background-color: #FFFFFF;">
        ${getHeader()}
        <h2 style="font-size: 22px; color: #111827; margin-top: 0;">Password Reset Request</h2>
        <p>You requested a password reset. Please use the following code to complete the process. This code will expire in 10 minutes.</p>
        <div style="background-color: #F3F4F6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #00008B; letter-spacing: 5px; margin: 0;">${code}</p>
        </div>
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        ${getFooter()}
      </div>
    `;
    const text = `Your password reset code for ${APP_NAME} is: ${code}. It will expire in 10 minutes.`;
    
    return { subject, html, text };
};


export function getEmailHtml(
    type: 'login' | 'verification' | 'password-reset-otp', 
    payload: { code?: string; link?: string }
): { subject: string; html: string; text: string } {
    switch(type) {
        case 'login':
            if (!payload.code) throw new Error("Missing 'code' for login email.");
            return getLoginEmail(payload.code);
        case 'verification':
            if (!payload.code) throw new Error("Missing 'code' for verification email.");
            return getVerificationEmail(payload.code);
        case 'password-reset-otp':
             if (!payload.code) throw new Error("Missing 'code' for password-reset-otp email.");
            return getPasswordResetOtpEmail(payload.code);
        default:
            throw new Error("Invalid email type specified.");
    }
}
