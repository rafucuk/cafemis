<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination ref="pagingComponent" :pagination="pagination" :disableAutoLoad="disableAutoLoad">
	<template #empty>
		<div class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.noNotes }}</div>
		</div>
	</template>

	<template #default="{ items: pages }">
		<div :class="[$style.root, { [$style.noGap]: noGap }]">
			<MkDateSeparatedList
				ref="pages"
				v-slot="{ item: page }"
				:items="pages"
				:direction="pagination.reversed ? 'up' : 'down'"
				:reversed="pagination.reversed"
				:noGap="noGap"
				:ad="true"
				:class="$style.pages"
			>
				<MkPagePreview :key="page._featuredId_ || page._prId_ || page.id" :class="$style.page" :page="page" :withHardMute="true"/>
			</MkDateSeparatedList>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, shallowRef, ref } from 'vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';
import MkPagePreview from '@/components/MkPagePreview.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';
import { defaultStore } from '@/store.js';

const MkNote = defineAsyncComponent(() =>
	(defaultStore.state.noteDesign === 'misskey') ? import('@/components/MkNote.vue') :
	(defaultStore.state.noteDesign === 'cafemis') ? import('@/components/SkNote.vue') :
	null
);

const props = defineProps<{
	pagination: Paging;
	noGap?: boolean;
	disableAutoLoad?: boolean;
}>();

const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();

defineExpose({
	pagingComponent,
});
</script>

<style lang="scss" module>
.root {
	&.noGap {
		border-radius: var(--MI-radius);

		> .pages {
			background: color-mix(in srgb, var(--MI_THEME-panel) 65%, transparent);
		}
	}

	&:not(.noGap) {
		> .pages {
			background: var(--MI_THEME-bg);

			.page {
				background: color-mix(in srgb, var(--MI_THEME-panel) 65%, transparent);
				border-radius: var(--MI-radius);
			}
		}
	}
}
</style>
