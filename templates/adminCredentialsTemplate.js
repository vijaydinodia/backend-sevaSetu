const adminCredentialsTemplate = (firstName, email, password, employeeId, categoryName) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7f6; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background-color: #f8ebe6; padding: 24px; text-align: center;">
          <h1 style="color: #18181b; margin: 0; font-size: 20px; letter-spacing: 0.5px;">SevaSetu Admin Access</h1>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; color: #18181b; line-height: 1.6; font-size: 15px;">
          <p>Dear <strong>${firstName}</strong>,</p>

          <p>Welcome to the SevaSetu Administration Team!</p>
          <p>Your Admin account has been created by the Super Admin. You have been assigned to manage the <strong>${categoryName || "your assigned"}</strong> category.</p>

          <div style="background-color: #fcfaf8; padding: 20px; border-radius: 6px; margin: 24px 0; border: 1px solid #e4e4e7;">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: #18181b; font-size: 16px;">Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #52525b; width: 140px;">Employee ID</td>
                <td style="padding: 8px 0; font-weight: bold; color: #18181b;">${employeeId || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #52525b;">Email</td>
                <td style="padding: 8px 0; font-weight: bold; color: #18181b;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #52525b;">Password</td>
                <td style="padding: 8px 0; font-weight: bold; color: #18181b; font-family: monospace; letter-spacing: 1px;">${password}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #52525b;">Assigned Category</td>
                <td style="padding: 8px 0; font-weight: bold; color: #18181b;">${categoryName || "N/A"}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 4px; font-weight: bold; font-size: 14px;">LOG IN</a>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              ⚠️ <strong>Important:</strong> Please log in and change your password immediately. Do not share these credentials with anyone.
            </p>
          </div>

          <p>As an admin, you are responsible for reviewing and approving provider applications, managing bookings, and handling operations within your assigned category.</p>
          <p>If you have any questions, please contact the Super Admin team.</p>

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

module.exports = adminCredentialsTemplate;

