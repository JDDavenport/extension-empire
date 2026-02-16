(function() {
	'use strict';

	var config = window.ccsConfig || {};
	var COOKIE_NAME = 'ccs_consent';
	var COOKIE_DETAIL = 'ccs_consent_categories';

	function getCookie(name) {
		var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
		return match ? decodeURIComponent(match[2]) : null;
	}

	function setCookie(name, value, days) {
		var d = new Date();
		d.setTime(d.getTime() + (days * 86400000));
		document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
	}

	function init() {
		// Already consented
		if (getCookie(COOKIE_NAME)) {
			unblockScripts(getCookie(COOKIE_DETAIL));
			return;
		}

		var banner = document.getElementById('ccs-banner');
		if (!banner) return;

		banner.style.display = 'block';

		// Accept all
		document.getElementById('ccs-accept-all').addEventListener('click', function() {
			var allCats = Object.keys(config.categories || {});
			saveConsent('all', allCats);
			hideBanner();
			unblockScripts('all');
		});

		// Reject non-essential
		document.getElementById('ccs-reject').addEventListener('click', function() {
			saveConsent('necessary', ['necessary']);
			hideBanner();
		});

		// Show settings
		document.getElementById('ccs-settings-btn').addEventListener('click', function() {
			var cats = document.getElementById('ccs-categories');
			var saveBtn = document.getElementById('ccs-save-prefs');
			cats.style.display = cats.style.display === 'none' ? 'flex' : 'none';
			saveBtn.style.display = cats.style.display === 'flex' ? 'inline-block' : 'none';
			this.style.display = 'none';
		});

		// Save preferences
		document.getElementById('ccs-save-prefs').addEventListener('click', function() {
			var selected = ['necessary'];
			var checkboxes = document.querySelectorAll('#ccs-categories input[type="checkbox"]');
			checkboxes.forEach(function(cb) {
				if (cb.checked && cb.dataset.category) {
					selected.push(cb.dataset.category);
				}
			});
			selected = [...new Set(selected)];
			saveConsent('custom', selected);
			hideBanner();
			unblockScripts(selected.join(','));
		});
	}

	function hideBanner() {
		var banner = document.getElementById('ccs-banner');
		if (banner) {
			banner.style.display = 'none';
		}
	}

	function saveConsent(level, categories) {
		var days = parseInt(config.cookieExpiry) || 365;
		setCookie(COOKIE_NAME, level, days);
		if (Array.isArray(categories)) {
			setCookie(COOKIE_DETAIL, categories.join(','), days);
		}

		// Log to server
		var xhr = new XMLHttpRequest();
		xhr.open('POST', config.ajaxUrl);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.send('action=ccs_save_consent&nonce=' + encodeURIComponent(config.nonce) + '&consent=' + encodeURIComponent(level + ':' + (Array.isArray(categories) ? categories.join(',') : '')));
	}

	function unblockScripts(categories) {
		if (!categories) return;
		var allowed = (typeof categories === 'string') ? categories.split(',') : categories;

		document.querySelectorAll('script[data-ccs-blocked]').forEach(function(el) {
			var cat = el.getAttribute('data-ccs-blocked');
			if (allowed.indexOf('all') !== -1 || allowed.indexOf(cat) !== -1) {
				var newScript = document.createElement('script');
				newScript.src = el.src;
				newScript.async = true;
				document.head.appendChild(newScript);
			}
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
