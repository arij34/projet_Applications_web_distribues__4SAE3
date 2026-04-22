import { Component } from '@angular/core';
import { SignupService, SignupPayload } from '../../services/signup.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  model: SignupPayload = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    accountType: 'CLIENT'
  };

  loading = false;
  error?: string;
  success?: string;

  constructor(private readonly signup: SignupService, private readonly auth: AuthService) {}

  async submit(): Promise<void> {
    this.error = undefined;
    this.success = undefined;
    this.loading = true;
    try {
      await this.signup.signup(this.model);
      this.success = 'Account created. Redirecting to Sign In...';
      // Go to Keycloak login
      await this.auth.login(window.location.origin + '/');
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Signup failed';
    } finally {
      this.loading = false;
    }
  }
}
