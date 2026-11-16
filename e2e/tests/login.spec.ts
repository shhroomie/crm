import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages'

test.describe('Login', () => {
	test.use({ storageState: { cookies: [], origins: [] } })

	test('signs in, retains the session on refresh, and signs out', async ({ page }) => {
		const login = new LoginPage(page)
		await login.login(
			process.env.FRAPPE_USER || 'Administrator',
			process.env.FRAPPE_PASSWORD || 'admin',
		)

		const leads = page.getByRole('link', { name: 'Leads' }).first()
		await expect(leads).toBeVisible()

		const identity = '/api/method/frappe.auth.get_logged_user'
		const signedIn = await page.request.get(identity)
		expect(signedIn.ok()).toBe(true)
		const { message: user } = await signedIn.json()
		expect(user).toEqual(expect.any(String))
		expect(user).not.toBe('Guest')

		await page.reload()
		await expect(leads).toBeVisible()
		const afterRefresh = await page.request.get(identity)
		expect(afterRefresh.ok()).toBe(true)
		expect(await afterRefresh.json()).toMatchObject({ message: user })

		await page
			.getByRole('button', { name: /CRM/i })
			.filter({ has: page.locator('.lucide-chevron-down') })
			.click()
		await page.getByText('Log out', { exact: true }).click()
		await login.expectOnLoginPage()
		expect((await page.request.get(identity)).status()).toBe(403)

		const crm = await page.request.get('/crm')
		expect(crm.status()).toBe(403)
	})

	test('shows the customised page and rejects invalid credentials', async ({ page }) => {
		const login = new LoginPage(page)
		await login.goto()
		await expect(page.locator('.crm-login-wordmark')).toHaveText('frappe / CRM')
		await expect(page.locator('.crm-login')).toHaveCSS('display', 'grid')
		await login.submit('fyp-invalid-user@example.invalid', 'wrong-password')
		const error = page.locator('.for-login .login-error-banner')
		await expect(error).toBeVisible()
		await expect(error).toContainText(/invalid/i)
		await login.expectOnLoginPage()
		const identity = await page.request.get('/api/method/frappe.auth.get_logged_user')
		expect(identity.status()).toBe(403)
	})
})
