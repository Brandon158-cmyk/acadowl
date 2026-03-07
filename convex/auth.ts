import { convexAuth } from '@convex-dev/auth/server';
import { Password } from '@convex-dev/auth/providers/Password';
import { Email } from '@convex-dev/auth/providers/Email';
import { PasswordReset, PasswordResetText } from './PasswordReset';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: Email({
        id: 'resend',
        from: 'acadowl <onboarding@resend.dev>',
        async sendVerificationRequest({ identifier, url }: { identifier: string; url: string }) {
          console.log(`[PASSWORD RESET] for ${identifier}: ${url}`);
          // In production, use your email service with:
          // html: <PasswordReset url={url} />
          // text: PasswordResetText({ url })
        },
      }),
    }),
  ],
});
