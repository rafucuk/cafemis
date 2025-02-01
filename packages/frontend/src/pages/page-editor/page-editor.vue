<template>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
		</template>
		<MkSpacer :contentMax="700">
			<div class="jqqmcavi">
				<MkButton v-if="pageId" class="button" inline link :to="`/@${ author.username }/pages/${ currentName }`">
					<i class="ti ti-external-link"></i> {{ i18n.ts._pages.viewPage }}
				</MkButton>
				<MkButton v-if="!readonly" inline primary class="button" @click="save">
					<i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}
				</MkButton>
				<MkButton v-if="pageId" inline class="button" @click="duplicate">
					<i class="ti ti-copy"></i> {{ i18n.ts.duplicate }}
				</MkButton>
				<MkButton v-if="pageId && !readonly" inline class="button" danger @click="del">
					<i class="ti ti-trash"></i> {{ i18n.ts.delete }}
				</MkButton>
			</div>

			<div v-if="tab === 'settings'">
				<div class="_gaps_m">
					<MkInput v-model="title">
						<template #label>{{ i18n.ts._pages.title }}</template>
					</MkInput>

					<MkInput v-model="summary">
						<template #label>{{ i18n.ts._pages.summary }}</template>
					</MkInput>

					<MkInput v-model="name">
						<template #prefix>@{{ author.username }}/pages/</template>
						<template #label>{{ i18n.ts._pages.url }}</template>
					</MkInput>

					<MkSwitch v-model="alignCenter">{{ i18n.ts._pages.alignCenter }}</MkSwitch>

					<MkSelect v-model="font">
						<template #label>{{ i18n.ts._pages.font }}</template>
						<option value="serif">{{ i18n.ts._pages.fontSerif }}</option>
						<option value="sans-serif">{{ i18n.ts._pages.fontSansSerif }}</option>
					</MkSelect>

					<MkSwitch v-model="hideTitleWhenPinned">{{ i18n.ts._pages.hideTitleWhenPinned }}</MkSwitch>

					<!-- New Modular Tags Input -->
					<div class="tags-input-wrapper">
						<label>{{ i18n.ts.hashtags }}</label>
						<div class="tags">
							<!-- Display each tag as a MkButton -->
							<MkButton v-for="(tag, index) in tags" :key="index" inline primary class="tag" @click="removeTag(index)">
								{{ tag }}
								<i class="ti ti-trash"></i>
							</MkButton>
							<!-- The input for adding new tags -->
							<MkInput
								v-model="tagInput"
								@keydown="onTagInputKeydown"
								:placeholder="i18n.ts._pages.tagsWrite"
								class="tag-input"
							/>
						</div>
						<div class="help-text">{{ i18n.ts._pages.tagsHelpText }}</div>
					</div>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>


<script lang="ts" setup>
import { computed, provide, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import XBlocks from './page-editor.blocks.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import { url } from '@@/js/config.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { selectFile } from '@/scripts/select-file.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { $i } from '@/account.js';
import { mainRouter } from '@/router/main.js';
import { getPageBlockList } from '@/pages/page-editor/common.js';

const props = defineProps<{
	initPageId?: string;
	initPageName?: string;
	initUser?: string;
}>();

const tab = ref('settings');
const author = ref($i);
const readonly = ref(false);
const page = ref<Misskey.entities.Page | null>(null);
const pageId = ref<string | null>(null);
const currentName = ref<string | null>(null);
const title = ref('');
const summary = ref<string | null>(null);
const name = ref(Date.now().toString());
const eyeCatchingImage = ref<Misskey.entities.DriveFile | null>(null);
const eyeCatchingImageId = ref<string | null>(null);
const font = ref('sans-serif');
const content = ref<Misskey.entities.Page['content']>([]);
const alignCenter = ref(false);
const hideTitleWhenPinned = ref(false);

// --- New Modular Tags System ---
// Remove the old single-string tags input in favor of an array-based system.
const tags = ref<string[]>([]);
const tagInput = ref('');

provide('readonly', readonly.value);

watch(eyeCatchingImageId, async () => {
	if (eyeCatchingImageId.value == null) {
		eyeCatchingImage.value = null;
	} else {
		eyeCatchingImage.value = await misskeyApi('drive/files/show', {
			fileId: eyeCatchingImageId.value,
		});
	}
});

function getSaveOptions() {
	return {
		title: title.value.trim(),
		name: name.value.trim(),
		summary: summary.value,
		font: font.value,
		script: '',
		hideTitleWhenPinned: hideTitleWhenPinned.value,
		alignCenter: alignCenter.value,
		content: content.value,
		variables: [],
		eyeCatchingImageId: eyeCatchingImageId.value,
		tags: tags.value, // Send tags as an array
	};
}

function save() {
	const options = getSaveOptions();

	const onError = err => {
		if (err.id === '3d81ceae-475f-4600-b2a8-2bc116157532') {
			if (err.info.param === 'name') {
				os.alert({
					type: 'error',
					title: i18n.ts._pages.invalidNameTitle,
					text: i18n.ts._pages.invalidNameText,
				});
			}
		} else if (err.code === 'NAME_ALREADY_EXISTS') {
			os.alert({
				type: 'error',
				text: i18n.ts._pages.nameAlreadyExists,
			});
		}
	};

	if (pageId.value) {
		options.pageId = pageId.value;
		misskeyApi('pages/update', options)
			.then(page => {
				currentName.value = name.value.trim();
				os.alert({
					type: 'success',
					text: i18n.ts._pages.updated,
				});
			}).catch(onError);
	} else {
		misskeyApi('pages/create', options)
			.then(created => {
				pageId.value = created.id;
				currentName.value = name.value.trim();
				os.alert({
					type: 'success',
					text: i18n.ts._pages.created,
				});
				mainRouter.push(`/pages/edit/${pageId.value}`);
			}).catch(onError);
	}
}

function del() {
	os.confirm({
		type: 'warning',
		text: i18n.tsx.removeAreYouSure({ x: title.value.trim() }),
	}).then(({ canceled }) => {
		if (canceled) return;
		misskeyApi('pages/delete', {
			pageId: pageId.value,
		}).then(() => {
			os.alert({
				type: 'success',
				text: i18n.ts._pages.deleted,
			});
			mainRouter.push('/pages');
		});
	});
}

function duplicate() {
	title.value = title.value + ' - copy';
	name.value = name.value + '-copy';
	misskeyApi('pages/create', getSaveOptions()).then(created => {
		pageId.value = created.id;
		currentName.value = name.value.trim();
		os.alert({
			type: 'success',
			text: i18n.ts._pages.created,
		});
		mainRouter.push(`/pages/edit/${pageId.value}`);
	});
}

async function add() {
	const { canceled, result: type } = await os.select({
		type: null,
		title: i18n.ts._pages.chooseBlock,
		items: getPageBlockList(),
	});
	if (canceled) return;

	const id = uuid();
	content.value.push({ id, type });
}

function setEyeCatchingImage(img) {
	selectFile(img.currentTarget ?? img.target, null).then(file => {
		eyeCatchingImageId.value = file.id;
	});
}

function removeEyeCatchingImage() {
	eyeCatchingImageId.value = null;
}

// --- Tag Input Handlers ---
// Adds the current tag input value as a tag if it is not empty and not already added.
function addTag() {
	const trimmed = tagInput.value.trim();
	if (trimmed && !tags.value.includes(trimmed)) {
		tags.value.push(trimmed);
	}
	tagInput.value = '';
}

// Listens for "Enter", "Space", or "," to trigger adding the tag.
function onTagInputKeydown(e: KeyboardEvent) {
	if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
		e.preventDefault();
		addTag();
	}
}

// Remove a tag from the tags array.
function removeTag(index: number) {
	tags.value.splice(index, 1);
}

async function init() {
	if (props.initPageId) {
		page.value = await misskeyApi('pages/show', {
			pageId: props.initPageId,
		});
	} else if (props.initPageName && props.initUser) {
		page.value = await misskeyApi('pages/show', {
			name: props.initPageName,
			username: props.initUser,
		});
		readonly.value = true;
	}

	if (page.value) {
		author.value = page.value.user;
		pageId.value = page.value.id;
		title.value = page.value.title;
		name.value = page.value.name;
		currentName.value = page.value.name;
		summary.value = page.value.summary;
		font.value = page.value.font;
		hideTitleWhenPinned.value = page.value.hideTitleWhenPinned;
		alignCenter.value = page.value.alignCenter;
		content.value = page.value.content;
		eyeCatchingImageId.value = page.value.eyeCatchingImageId;
		// Initialize tags if available
		if (page.value.tags && Array.isArray(page.value.tags)) {
			tags.value = page.value.tags;
		}
	} else {
		const id = uuid();
		content.value = [{
			id,
			type: 'text',
			text: 'Hello World!',
		}];
	}
}

init();

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'settings',
	title: i18n.ts._pages.pageSetting,
	icon: 'ti ti-settings',
}, {
	key: 'contents',
	title: i18n.ts._pages.contents,
	icon: 'ti ti-note',
}]);

definePageMetadata(() => ({
	title: props.initPageId ? i18n.ts._pages.editPage
				: props.initPageName && props.initUser ? i18n.ts._pages.readPage
				: i18n.ts._pages.newPage,
	icon: 'ti ti-pencil',
}));
</script>

<style lang="scss" module>
.contents {
	&:global {
		> .add {
			margin: 16px auto 0 auto;
		}
	}
}
</style>

<style lang="scss" scoped>
.jqqmcavi {
	margin-bottom: 16px;

	> .button {
		& + .button {
			margin-left: 8px;
		}
	}
}

.gwbmwxkm {
	position: relative;

	> header {
		> .title {
			z-index: 1;
			margin: 0;
			padding: 0 16px;
			line-height: 42px;
			font-size: 0.9em;
			font-weight: bold;
			box-shadow: 0 1px rgba(#000, 0.07);

			> i {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .buttons {
			position: absolute;
			z-index: 2;
			top: 0;
			right: 0;

			> button {
				padding: 0;
				width: 42px;
				font-size: 0.9em;
				line-height: 42px;
			}
		}
	}

	> section {
		padding: 0 32px 32px 32px;

		@media (max-width: 500px) {
			padding: 0 16px 16px 16px;
		}

		> .view {
			display: inline-block;
			margin: 16px 0 0 0;
			font-size: 14px;
		}

		> .content {
			margin-bottom: 16px;
		}

		> .eyeCatch {
			margin-bottom: 16px;

			> div {
				> img {
					max-width: 100%;
				}
			}
		}
	}
}

.qmuvgica {
	padding: 16px;

	> .variables {
		margin-bottom: 16px;
	}

	> .add {
		margin-bottom: 16px;
	}
}

/* Styles for the modular tags input */
.tags-input-wrapper {
	margin-bottom: 16px;

	label {
		display: block;
		font-weight: bold;
		margin-bottom: 4px;
	}


	.tags {
		margin-top: 12px;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;

		.tag-input {
			flex: 1;
			min-width: 120px;
			border: none;
			outline: none;
			padding: 4px;
		}
	}

	.help-text {
		font-size: 0.85em;
		color: #777;
		margin-top: 4px;
	}
}
</style>
