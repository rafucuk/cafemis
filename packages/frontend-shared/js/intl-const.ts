/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { lang } from '@@/js/config.js';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const versatileLang = (lang ?? 'ja-JP').replace('ja-KS', 'ja-JP');

let _dateTimeFormat: Intl.DateTimeFormat;
try {
	_dateTimeFormat = new Intl.DateTimeFormat(versatileLang, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	});
} catch (err) {
	console.warn(err);
	if (_DEV_) console.log('[Intl] Fallback to tr-TR');

	// Fallback to tr-TR
	_dateTimeFormat = new Intl.DateTimeFormat('tr-TR', {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	});
}
export const dateTimeFormat = _dateTimeFormat;

export const timeZone = dateTimeFormat.resolvedOptions().timeZone;

export const hemisphere = /^(australia|pacific|antarctica|indian)\//i.test(timeZone) ? 'S' : 'N';

let _numberFormat: Intl.NumberFormat;
try {
	_numberFormat = new Intl.NumberFormat(versatileLang);
} catch (err) {
	console.warn(err);
	if (_DEV_) console.log('[Intl] Fallback to tr-TR');

	// Fallback to tr-TR
	_numberFormat = new Intl.NumberFormat('tr-TR');
}
export const numberFormat = _numberFormat;
