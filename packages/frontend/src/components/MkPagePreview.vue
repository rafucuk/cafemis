<template>
<MkA :to="`/@${page.user.username}/pages/${page.name}`" class="vhpxefrj">
	<div v-if="page.eyeCatchingImage" class="thumbnail">
		<MediaImage
			:image="page.eyeCatchingImage"
			:disableImageLink="true"
			:controls="false"
			:cover="true"
			:class="$style.eyeCatchingImageRoot"
		/>
	</div>
	<article>
		<header>
			<h1 :title="page.title">{{ page.title }}</h1>
		</header>
		<p v-if="page.summary" :title="page.summary">{{ page.summary.length > 85 ? page.summary.slice(0, 85) + '…' : page.summary }}</p>
		<footer>
			<img v-if="page.user.avatarUrl" class="icon" :src="page.user.avatarUrl"/>
			<MkUserName :key="page.user.id" :user="page.user"/>
		</footer>
		<div v-if="page.tags && page.tags.length" class="tags">
			<span v-for="tag in page.tags" :key="tag" class="tag">{{ tag }}</span>
		</div>
	</article>
</MkA>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import MediaImage from '@/components/MkMediaImage.vue';

const props = defineProps<{
	page: Misskey.entities.Page;
}>();
</script>

<style module>
.eyeCatchingImageRoot {
	width: 100%;
	height: 200px;
	border-radius: var(--MI-radius) var(--MI-radius) 0 0;
	overflow: hidden;
}
</style>

<style lang="scss" scoped>
.vhpxefrj {
	display: block;
	position: relative;

	&:hover {
		text-decoration: none;
		color: var(--MI_THEME-accent);
	}

	&:focus-within {
		outline: none;

		&::after {
			content: "";
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			border-radius: var(--MI-radius);
			pointer-events: none;
			box-shadow: inset 0 0 0 2px var(--MI_THEME-focus);
		}
	}

	> .thumbnail {
		& + article {
			border-radius: 0 0 var(--MI-radius) var(--MI-radius);
		}
	}

	> article {
		background-color: var(--MI_THEME-panel);
		padding: 16px;
		border-radius: var(--MI-radius);

		> header {
			margin-bottom: 8px;

			> h1 {
				margin: 0;
				font-size: 1em;
				color: var(--urlPreviewTitle);
			}
		}

		> p {
			margin: 0;
			color: var(--urlPreviewText);
			font-size: 0.8em;
		}

		> footer {
			margin-top: 8px;
			height: 16px;

			> img {
				display: inline-block;
				width: 16px;
				height: 16px;
				margin-right: 4px;
				vertical-align: top;
			}

			> p {
				display: inline-block;
				margin: 0;
				font-size: 0.8em;
				line-height: 16px;
				vertical-align: top;
			}
		}

		.tags {
			margin-top: 12px;
			display: flex;
			flex-wrap: wrap;
			gap: 6px;

			.tag {
				background-color: var(--MI_THEME-accent);
				color: white;
				padding: 4px 8px;
				border-radius: 999px;
				font-size: 0.75em;
				white-space: nowrap;
			}
		}
	}
}
</style>
