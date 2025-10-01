<template>
	<private-view title="Build Sites">
		<template #headline>Publish</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="build" />
			</v-button>
		</template>

		<template #navigation>
			<Navigation />
		</template>

		<!-- Loading -->
		<div v-if="loading" style="margin: 25px auto; max-width: 50px">
			<v-progress-circular indeterminate />
		</div>

		<!-- Setup Required -->
		<Message
			v-if="!loading && setupMessage"
			icon="settings"
			title="Setup Required"
			:subtitle="setupMessage">
			Go to the
			<strong>&nbsp;&nbsp;<v-icon name="settings"></v-icon>&nbsp;</strong>
			Settings page to configure the sites to build.
		</Message>

		<!-- No Sites -->
		<Message
			v-if="!loading && !setupMessage && sites && sites.length === 0"
			icon="settings"
			title="Setup Required"
			subtitle="No Sites Configured">
			Go to the
			<strong>&nbsp;&nbsp;<v-icon name="settings"></v-icon>&nbsp;</strong>
			Settings page to add a site.
		</Message>

		<!-- List of Sites -->
		<Sites
			v-if="!loading && !setupMessage && sites && sites.length > 0"
			page="build"
			:sites="sites"
			@update="displaySites"
		/>
	</private-view>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from "vue";
import type { AxiosInstance } from "axios";

import {
	collectionExists,
	getSites,
	getLastActivityId,
} from "../settings";
import Navigation from "../components/Navigation.vue";
import Message from "../components/message.vue";
import Sites from "../components/Sites.vue";

// ambil api dari Directus (diinject oleh UI extension)
const api = inject<AxiosInstance>("api");

// state
const loading = ref(true);
const setupMessage = ref<string | undefined>();
const sites = ref<Record<string, any>[]>([]);
const lastActivityId = ref<number | undefined>();

async function setup() {
	if (!api) return;
	const exists = await collectionExists(api);
	setupMessage.value = !exists ? "Build Settings Missing" : undefined;
}

async function displaySites() {
	if (!api) return;
	if (!sites.value.length) loading.value = true;

	const result = await getSites(api);

	if (!result || result.length === 0) {
		if (!sites.value.length) {
			setupMessage.value = "Could not get Sites from Settings";
		}
		sites.value = [];
	} else {
		sites.value = result;
	}
	loading.value = false;
}

onMounted(async () => {
	await setup();
	await displaySites();

	if (api) {
		lastActivityId.value = await getLastActivityId(api);
	}
});
</script>
