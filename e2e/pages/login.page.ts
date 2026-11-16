import { Page, expect } from '@playwright/test'

/**
 * Frappe's login page with the CRM return URL.
 */
export class LoginPage {
	constructor(private page: Page) {}

	async goto() {
		await this.page.goto('/login?redirect-to=/crm')
	}

	async login(email = 'Administrator', password = 'admin') {
		await this.goto()
		await this.submit(email, password)
		await this.page.waitForURL((url) => /^\/crm(?:\/|$)/.test(url.pathname), {
			timeout: 30000,
		})
	}

	async submit(email: string, password: string) {
		const form = this.page.locator('.for-login .form-login')
		await form.locator('#login_email').fill(email)
		await form.locator('#login_password').fill(password)
		await form.locator('button[type="submit"]').click()
	}

	async expectOnLoginPage() {
		await expect(this.page).toHaveURL((url) => url.pathname === '/login')
	}
}
