from frappe import local
from frappe.www.login import get_context as get_frappe_login_context
from frappe.www.login import no_cache as no_cache


def get_context(context):
	context = get_frappe_login_context(context)
	context.crm_login_layout = local.request.args.get("redirect-to") == "/crm"
	return context
