const otpTemplate = (otp) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7f6; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background-color: #f8ebe6; padding: 24px; text-align: center;">
          <h1 style="color: #18181b; margin: 0; font-size: 20px; letter-spacing: 0.5px;">Your OTP Verification Code</h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; color: #18181b; line-height: 1.6; font-size: 15px;">
          <p>Hi,</p>
          <p>You have requested to reset your account password.</p>
          <p>To ensure safety & security, please use the following OTP code to verify your account. You will then be prompted to reset a new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            ${otp.split('').map(digit => `<span style="display: inline-block; width: 40px; height: 40px; line-height: 40px; background-color: #f8ebe6; border: 1px solid #e4e4e7; border-radius: 4px; font-size: 18px; font-weight: bold; color: #18181b; margin: 0 4px;">${digit}</span>`).join('')}
          </div>
          
          <p>Please enter this OTP within 15 minutes of receiving this email to complete your verification process.</p>
          <p style="font-size: 13px; color: #666;">If you did not request this, please ignore this email.</p>
          
          <div style="margin-top: 40px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #888888; font-style: italic;">Note : This is a system generated message. Do not reply.</p>
          </div>
          
          <div style="margin-top: 20px;">
            <p style="margin: 0; font-size: 14px;">Best Regards,</p>
            <p style="margin: 4px 0 0; font-size: 14px; font-weight: bold;">Team SevaSetu</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #ffffff; padding: 0 24px 24px; text-align: center;">
          <h2 style="color: #18181b; margin: 0 0 8px; font-size: 18px; letter-spacing: 1px;">SevaSetu</h2>
          <p style="margin: 0; font-size: 12px; color: #52525b;">© ${new Date().getFullYear()} SevaSetu. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
};

module.exports = otpTemplate;
