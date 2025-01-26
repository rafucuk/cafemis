<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<MkStickyContainer>
		<template #header><MkPageHeader/></template>
		<MkSpacer :contentMax="800">
			<div class="_gaps">
				<div class="_panel" :class="$style.link">
					<MkA to="/bubble-game">
						<div style="padding: 32px; display: flex; align-items: center; justify-content: center; height: 100%;">
							<h2 style="margin: 0;">Drop & Fusion</h2>
						</div>
					</MkA>
				</div>
				<div class="_panel" :class="$style.link">
					<MkA to="/reversi">
						<div style="padding: 32px; display: flex; align-items: center; justify-content: center; height: 100%;">
							<h2 style="margin: 0;">Reversi</h2>
						</div>
					</MkA>
				</div>
				<div class="_panel" :class="$style.link">
					<MkA to="/sudoku">
						<div style="padding: 32px; display: flex; align-items: center; justify-content: center; height: 100%;">
							<h2 style="margin: 0;">Sudoku</h2>
						</div>
					</MkA>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
	</template>
	
	<script lang="ts" setup>
	import { i18n } from '@/i18n.js';
	import { definePageMetadata } from '@/scripts/page-metadata.js';
	
	definePageMetadata(() => ({
		title: 'Cafemis Games',
		icon: 'ti ti-device-gamepad',
	}));
	</script>
	
	<style module>
	.link:focus-within {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: -2px;
	}
	</style>