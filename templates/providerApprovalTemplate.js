const providerApprovalTemplate = (firstName, email, password) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
      
      <h2 style="color:#9333ea;">
        Welcome to SevaSetu - Provider Account Approved!
      </h2>

      <p>Hello ${firstName},</p>

      <p>
        Great news! Your provider account has been <strong>approved</strong> by our admin team.
        You can now login and start accepting bookings.
      </p>

      <h3>Your Login Credentials</h3>

      <table style="border-collapse: collapse;">
        <tr>
          <td><strong>Email:</strong></td>
          <td>${email}</td>
        </tr>

        <tr>
          <td><strong>Password:</strong></td>
          <td>${password}</td>
        </tr>
      </table>

      <br />

      <p>
        Please login and change your password immediately for security reasons.
      </p>

      <br />

      <p>Regards,</p>
      <p><strong>SevaSetu Team</strong></p>

    </div>
  `;
};

module.exports = providerApprovalTemplate;
