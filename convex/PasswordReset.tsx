/**
 * Password Reset Email Component.
 *
 * Using plain HTML because @convex-dev/auth doesn't export layout components in this version.
 */
export function PasswordReset({ url }: { url: string }) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Reset your password</h1>
      <p>
        A password reset was requested for your acadowl account. Click the button below to set a new
        password.
      </p>
      <a
        href={url}
        style={{
          display: 'inline-block',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '12px 24px',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: '500',
        }}
      >
        Reset Password
      </a>
      <p style={{ marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
        If you didn't request this, you can safely ignore this email. The link will expire in 24
        hours.
      </p>
    </div>
  );
}

export function PasswordResetText({ url }: { url: string }) {
  return `Reset your acadowl password: ${url}\n\nIf you didn't request this, you can safely ignore this email.`;
}
