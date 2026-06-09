const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}

	// Securely extract the token FIRST to guarantee it is removed from the URL
	// before any other parameters (like window.location.href) are evaluated.
	const token = getAppParamValue("access_token", { removeFromUrl: true });

	// Ensure the fallback URL does not contain the access token
	let fallbackUrl = window.location.href;
	try {
		const u = new URL(fallbackUrl);
		if (u.searchParams.has("access_token")) {
			u.searchParams.delete("access_token");
			fallbackUrl = u.toString();
		}
	} catch (e) {
		// Ignore invalid URLs
	}

	let fromUrl = getAppParamValue("from_url", { defaultValue: fallbackUrl });
	// Sanitize fromUrl just in case the provided from_url parameter contains the token
	if (fromUrl && typeof fromUrl === 'string') {
		try {
			// We use a dummy base to parse relative URLs
			const u = new URL(fromUrl, window.location.origin);
			if (u.searchParams.has("access_token")) {
				u.searchParams.delete("access_token");
				// Restore relative path if it was relative
				fromUrl = fromUrl.startsWith('http') ? u.toString() : u.pathname + u.search + u.hash;
			}
		} catch (e) {
			// Ignore
		}
	}

	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token,
		fromUrl,
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}

export const appParams = {
	...getAppParams()
}
