<template>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader :actions="headerActions" :displayBackButton="true" :tabs="headerTabs" />
		</template>
		<MkSpacer :contentMax="800">
			<!-- Only load notes if at least one note exists -->
			<template v-if="notesExist === true">
				<MkNotes ref="notes" :pagination="notesPagination" />
			</template>
			<!-- Optionally, you could show a spinner or nothing when notesExist is null (loading) -->
			<!-- Pages list -->
			<MkPagination v-slot="{ items }" :pagination="pagesPagination">
				<div class="_gaps">
					<MkPagePreview v-for="page in items" :key="page.id" :page="page" />
				</div>
			</MkPagination>
		</MkSpacer>
		<template v-if="$i" #footer>
			<div :class="$style.footer">
				<MkSpacer :contentMax="800" :marginMin="16" :marginMax="16">
					<MkButton rounded primary :class="$style.button" @click="post()">
						<i class="ti ti-pencil"></i>{{ i18n.ts.postToHashtag }}
					</MkButton>
				</MkSpacer>
			</div>
		</template>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkPagePreview from '@/components/MkPagePreview.vue';
import MkButton from '@/components/MkButton.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import { defaultStore } from '@/store.js';
import * as os from '@/os.js';
import { genEmbedCode } from '@/scripts/get-embed-code.js';

const props = defineProps<{
	tag: string;
}>();

// Pagination configuration for notes
const notesPagination = {
	endpoint: 'notes/search-by-tag' as const,
	limit: 10,
	params: computed(() => ({
		tag: props.tag,
	})),
};

// Pagination configuration for pages
const pagesPagination = {
	endpoint: 'pages/search-by-tag' as const,
	limit: 10,
	params: computed(() => ({
		tag: props.tag,
	})),
};

const notes = ref<InstanceType<typeof MkNotes>>();

// A reactive flag indicating if notes exist for the given tag:
//  - null: not yet determined (loading)
//  - true: at least one note exists
//  - false: no notes found
const notesExist = ref<boolean | null>(null);

/**
 * Checks if there are any notes for the current tag.
 * This simple check requests only one note.
 */
async function checkNotesExistence() {
	try {
		// Adjust the URL as needed. Here we assume a JSON API returning an array.
		const url = `/api/notes/search-by-tag?tag=${encodeURIComponent(props.tag)}&limit=1`;
		const response = await fetch(url);
		if (!response.ok) throw new Error('Network response was not ok');
		const data = await response.json();
		notesExist.value = Array.isArray(data) && data.length > 0;
	} catch (error) {
		// In case of error, assume no notes (or adjust this behavior as desired)
		notesExist.value = false;
	}
}

onMounted(() => {
	checkNotesExistence();
});

async function post() {
	defaultStore.set('postFormHashtags', props.tag);
	defaultStore.set('postFormWithHashtags', true);
	await os.post();
	defaultStore.set('postFormHashtags', '');
	defaultStore.set('postFormWithHashtags', false);
	// Reload notes only if they were loaded
	notes.value?.pagingComponent?.reload();
	// MkPagination for pages should reload itself if needed,
	// or you can add a ref and call its reload method here.
}

const headerActions = computed(() => [
	{
		icon: 'ti ti-dots',
		label: i18n.ts.more,
		handler: (ev: MouseEvent) => {
			os.popupMenu(
				[
					{
						text: i18n.ts.genEmbedCode,
						icon: 'ti ti-code',
						action: () => {
							genEmbedCode('tags', props.tag);
						},
					},
				],
				ev.currentTarget ?? ev.target
			);
		},
	},
]);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: props.tag,
	icon: 'ti ti-hash',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	background: var(--MI_THEME-acrylicBg);
	border-top: solid 0.5px var(--MI_THEME-divider);
	display: flex;
}

.button {
	margin: 0 auto;
}

/* Optional: spacing for the pages section */
._gaps {
	margin-top: 24px;
}
</style>
